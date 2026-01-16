use image::{imageops, DynamicImage, ImageFormat, ImageReader};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResizeOptions {
    pub mode: String, // "fixed" | "longest-side" | "upscale"
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(rename = "longestSide")]
    pub longest_side: Option<u32>,
    #[serde(rename = "keepAspect")]
    pub keep_aspect: bool,
    #[serde(rename = "upscaleMultiplier")]
    pub upscale_multiplier: Option<u32>, // 2, 3, or 4
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropOptions {
    pub enabled: bool,
    pub aspect: String, // "free" | "1:1" | "4:3" | "16:9"
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotateOptions {
    pub degrees: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputOptions {
    pub format: String, // "jpeg" | "png" | "webp"
    pub quality: u8,
    #[serde(rename = "targetSizeKB")]
    pub target_size_kb: Option<u32>,
    pub background: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessFlags {
    #[serde(rename = "stripMetadata")]
    pub strip_metadata: bool,
    pub overwrite: bool,
    pub recursive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamingOptions {
    pub prefix: String,
    pub suffix: String,
    #[serde(rename = "startIndex")]
    pub start_index: u32,
    pub pad: u32,
    #[serde(rename = "keepOriginal")]
    pub keep_original: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchOptions {
    pub resize: ResizeOptions,
    pub crop: CropOptions,
    pub rotate: RotateOptions,
    pub output: OutputOptions,
    pub flags: ProcessFlags,
    pub naming: NamingOptions,
}

#[derive(Debug, Clone)]
pub struct ImageFileInfo {
    pub path: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProgressEvent {
    pub total: usize,
    pub done: usize,
    #[serde(rename = "currentFile")]
    pub current_file: String,
    pub percent: f32,
    #[serde(rename = "currentFilePercent")]
    pub current_file_percent: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ItemDoneEvent {
    pub file: String,
    #[serde(rename = "outFile")]
    pub out_file: String,
    #[serde(rename = "savedBytes")]
    pub saved_bytes: i64,
    #[serde(rename = "outSizeBytes")]
    pub out_size_bytes: u64,
    #[serde(rename = "outWidth")]
    pub out_width: u32,
    #[serde(rename = "outHeight")]
    pub out_height: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ItemErrorEvent {
    pub file: String,
    pub message: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BatchDoneEvent {
    pub total: usize,
    pub success: usize,
    pub failed: usize,
    #[serde(rename = "totalSavedBytes")]
    pub total_saved_bytes: i64,
}

#[derive(Clone)]
pub struct ImageProcessor {
    app: AppHandle,
    cancelled: Arc<AtomicBool>,
}

impl ImageProcessor {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::Relaxed);
    }

    pub async fn process_batch(
        &self,
        files: Vec<ImageFileInfo>,
        output_dir: String,
        options: BatchOptions,
    ) -> Result<(), String> {
        let total = files.len();
        let mut success = 0;
        let mut failed = 0;
        let mut total_saved_bytes: i64 = 0;

        // Create output directory if it doesn't exist
        if !options.flags.overwrite {
            fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
        }

        for (idx, file_info) in files.iter().enumerate() {
            if self.cancelled.load(Ordering::Relaxed) {
                break;
            }

            // Emit progress
            let _ = self.app.emit(
                "progress",
                ProgressEvent {
                    total,
                    done: idx,
                    current_file: file_info.name.clone(),
                    percent: (idx as f32 / total as f32) * 100.0,
                    current_file_percent: 0.0,
                },
            );

            match self.process_single_image(file_info, &output_dir, &options, idx).await {
                Ok(result) => {
                    success += 1;
                    total_saved_bytes += result.saved_bytes;
                    let _ = self.app.emit("item_done", result);
                }
                Err(e) => {
                    failed += 1;
                    let _ = self.app.emit(
                        "item_error",
                        ItemErrorEvent {
                            file: file_info.path.clone(),
                            message: e,
                        },
                    );
                }
            }
        }

        // Emit batch done
        let _ = self.app.emit(
            "batch_done",
            BatchDoneEvent {
                total,
                success,
                failed,
                total_saved_bytes,
            },
        );

        Ok(())
    }

    async fn process_single_image(
        &self,
        file_info: &ImageFileInfo,
        output_dir: &str,
        options: &BatchOptions,
        index: usize,
    ) -> Result<ItemDoneEvent, String> {
        // Load image
        let img = ImageReader::open(&file_info.path)
            .map_err(|e| format!("Failed to open: {}", e))?
            .decode()
            .map_err(|e| format!("Failed to decode: {}", e))?;

        let original_size = fs::metadata(&file_info.path)
            .map(|m| m.len())
            .unwrap_or(0);

        let (orig_width, orig_height) = (img.width(), img.height());

        // Apply transformations
        let mut processed = img;

        // 1. Crop (먼저 크롭)
        if options.crop.enabled {
            processed = self.apply_crop(processed, &options.crop)?;
        }

        // 2. Rotate (회전)
        if options.rotate.degrees != 0 {
            processed = self.apply_rotate(processed, options.rotate.degrees);
        }

        // 3. Resize/Upscale (크기 조정 또는 업스케일)
        // 업스케일 모드면 원본 크기 기반으로 배율 계산
        if options.resize.mode == "upscale" {
            let multiplier = options.resize.upscale_multiplier.unwrap_or(2);
            let upscale_width = orig_width * multiplier;
            let upscale_height = orig_height * multiplier;
            processed = processed.resize(upscale_width, upscale_height, imageops::FilterType::Lanczos3);
        } else {
            processed = self.apply_resize(processed, &options.resize)?;
        }

        // 4. Convert format if needed
        processed = self.apply_format_conversion(processed, &options.output)?;

        // Generate output filename
        let output_path = self.generate_output_path(
            &file_info.name,
            output_dir,
            &options.output.format,
            &options.naming,
            index,
            options.flags.overwrite,
            &file_info.path,
        )?;

        // Save with quality/compression
        let output_size = self.save_image(&processed, &output_path, options)?;

        let (out_width, out_height) = (processed.width(), processed.height());

        Ok(ItemDoneEvent {
            file: file_info.path.clone(),
            out_file: output_path,
            saved_bytes: original_size as i64 - output_size as i64,
            out_size_bytes: output_size,
            out_width,
            out_height,
        })
    }

    fn apply_crop(&self, img: DynamicImage, crop: &CropOptions) -> Result<DynamicImage, String> {
        let (img_width, img_height) = (img.width(), img.height());

        let (x, y, width, height) = if crop.aspect != "free" {
            // Calculate dimensions based on aspect ratio
            let aspect_ratio = match crop.aspect.as_str() {
                "1:1" => 1.0,
                "4:3" => 4.0 / 3.0,
                "16:9" => 16.0 / 9.0,
                _ => 1.0,
            };

            // Center crop with aspect ratio
            let target_width = img_width;
            let target_height = (target_width as f32 / aspect_ratio) as u32;

            let (final_width, final_height) = if target_height > img_height {
                let h = img_height;
                let w = (h as f32 * aspect_ratio) as u32;
                (w, h)
            } else {
                (target_width, target_height)
            };

            let x = (img_width.saturating_sub(final_width)) / 2;
            let y = (img_height.saturating_sub(final_height)) / 2;

            (x, y, final_width, final_height)
        } else {
            (crop.x, crop.y, crop.width, crop.height)
        };

        // Validate bounds
        if x + width > img_width || y + height > img_height {
            return Err("Crop dimensions out of bounds".to_string());
        }

        Ok(img.crop_imm(x, y, width, height))
    }

    fn apply_rotate(&self, img: DynamicImage, degrees: i32) -> DynamicImage {
        match degrees {
            90 => img.rotate90(),
            180 => img.rotate180(),
            270 => img.rotate270(),
            _ => img,
        }
    }

    fn apply_resize(&self, img: DynamicImage, resize: &ResizeOptions) -> Result<DynamicImage, String> {
        let (orig_width, orig_height) = (img.width(), img.height());

        let (new_width, new_height) = match resize.mode.as_str() {
            "upscale" => {
                // 업스케일: 원본의 2배 크기로
                (orig_width * 2, orig_height * 2)
            }
            "longest-side" => {
                if let Some(longest) = resize.longest_side {
                    let (w, h) = if orig_width > orig_height {
                        let ratio = longest as f32 / orig_width as f32;
                        (longest, (orig_height as f32 * ratio) as u32)
                    } else {
                        let ratio = longest as f32 / orig_height as f32;
                        ((orig_width as f32 * ratio) as u32, longest)
                    };
                    (w, h)
                } else {
                    (orig_width, orig_height)
                }
            }
            "fixed" => {
                if resize.keep_aspect {
                    let target_w = resize.width.unwrap_or(orig_width);
                    let target_h = resize.height.unwrap_or(orig_height);
                    
                    let ratio_w = target_w as f32 / orig_width as f32;
                    let ratio_h = target_h as f32 / orig_height as f32;
                    let ratio = ratio_w.min(ratio_h);
                    
                    ((orig_width as f32 * ratio) as u32, (orig_height as f32 * ratio) as u32)
                } else {
                    (
                        resize.width.unwrap_or(orig_width),
                        resize.height.unwrap_or(orig_height),
                    )
                }
            }
            _ => (orig_width, orig_height),
        };

        if new_width == orig_width && new_height == orig_height {
            Ok(img)
        } else {
            // 업스케일의 경우 더 고품질 필터 사용
            let filter = if resize.mode == "upscale" {
                imageops::FilterType::Lanczos3
            } else {
                imageops::FilterType::Lanczos3
            };
            Ok(img.resize(new_width, new_height, filter))
        }
    }

    fn apply_format_conversion(
        &self,
        img: DynamicImage,
        output: &OutputOptions,
    ) -> Result<DynamicImage, String> {
        // Handle PNG to JPEG conversion (add background)
        if output.format == "jpeg" && img.color().has_alpha() {
            let bg_color = output.background.as_deref().unwrap_or("#FFFFFF");
            let rgb = self.parse_color(bg_color)?;
            
            let (width, height) = (img.width(), img.height());
            let mut rgb_img = image::RgbImage::new(width, height);
            
            // Fill with background color
            for pixel in rgb_img.pixels_mut() {
                *pixel = image::Rgb([rgb.0, rgb.1, rgb.2]);
            }
            
            // Convert image to RGBA and blend manually
            let rgba_img = img.to_rgba8();
            for (x, y, pixel) in rgba_img.enumerate_pixels() {
                let alpha = pixel[3] as f32 / 255.0;
                let inv_alpha = 1.0 - alpha;
                
                let bg_pixel = rgb_img.get_pixel_mut(x, y);
                bg_pixel[0] = ((pixel[0] as f32 * alpha) + (bg_pixel[0] as f32 * inv_alpha)) as u8;
                bg_pixel[1] = ((pixel[1] as f32 * alpha) + (bg_pixel[1] as f32 * inv_alpha)) as u8;
                bg_pixel[2] = ((pixel[2] as f32 * alpha) + (bg_pixel[2] as f32 * inv_alpha)) as u8;
            }
            
            Ok(DynamicImage::ImageRgb8(rgb_img))
        } else {
            Ok(img)
        }
    }

    fn parse_color(&self, color: &str) -> Result<(u8, u8, u8), String> {
        let color = color.trim_start_matches('#');
        if color.len() != 6 {
            return Ok((255, 255, 255)); // Default white
        }
        
        let r = u8::from_str_radix(&color[0..2], 16).unwrap_or(255);
        let g = u8::from_str_radix(&color[2..4], 16).unwrap_or(255);
        let b = u8::from_str_radix(&color[4..6], 16).unwrap_or(255);
        
        Ok((r, g, b))
    }

    fn generate_output_path(
        &self,
        original_name: &str,
        output_dir: &str,
        format: &str,
        naming: &NamingOptions,
        index: usize,
        overwrite: bool,
        original_path: &str,
    ) -> Result<String, String> {
        if overwrite {
            return Ok(original_path.to_string());
        }

        let stem = Path::new(original_name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");

        let ext = format.to_lowercase();

        let filename = if naming.keep_original {
            format!(
                "{}{}{}{}",
                naming.prefix,
                stem,
                naming.suffix,
                if !naming.suffix.is_empty() { "" } else { "" }
            )
        } else {
            let num = naming.start_index + index as u32;
            format!(
                "{}{}",
                naming.prefix,
                format!("{:0width$}", num, width = naming.pad as usize)
            )
        };

        let mut output_path = PathBuf::from(output_dir);
        output_path.push(format!("{}.{}", filename, ext));

        // Handle filename conflicts
        let mut counter = 1;
        while output_path.exists() {
            output_path = PathBuf::from(output_dir);
            output_path.push(format!("{}_{}.{}", filename, counter, ext));
            counter += 1;
        }

        output_path
            .to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Invalid output path".to_string())
    }

    fn save_image(
        &self,
        img: &DynamicImage,
        path: &str,
        options: &BatchOptions,
    ) -> Result<u64, String> {
        let format = match options.output.format.as_str() {
            "jpeg" | "jpg" => ImageFormat::Jpeg,
            "png" => ImageFormat::Png,
            "webp" => ImageFormat::WebP,
            _ => ImageFormat::Jpeg,
        };

        // If target size is specified, use binary search to find quality
        if let Some(target_kb) = options.output.target_size_kb {
            self.save_with_target_size(img, path, format, target_kb, options.output.quality)
        } else {
            self.save_with_quality(img, path, format, options.output.quality)
        }
    }

    fn save_with_quality(
        &self,
        img: &DynamicImage,
        path: &str,
        format: ImageFormat,
        quality: u8,
    ) -> Result<u64, String> {
        match format {
            ImageFormat::Jpeg => {
                let mut output = fs::File::create(path).map_err(|e| e.to_string())?;
                let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, quality);
                encoder.encode_image(img).map_err(|e| e.to_string())?;
            }
            ImageFormat::Png => {
                img.save_with_format(path, ImageFormat::Png)
                    .map_err(|e| e.to_string())?;
            }
            ImageFormat::WebP => {
                // Use webp crate for better control
                let (width, height) = (img.width(), img.height());
                let rgba = img.to_rgba8();
                let encoder = webp::Encoder::from_rgba(&rgba, width, height);
                let webp_data = encoder.encode(quality as f32);
                fs::write(path, &*webp_data).map_err(|e| e.to_string())?;
            }
            _ => {
                img.save(path).map_err(|e| e.to_string())?;
            }
        }

        let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
        Ok(size)
    }

    fn save_with_target_size(
        &self,
        img: &DynamicImage,
        path: &str,
        format: ImageFormat,
        target_kb: u32,
        initial_quality: u8,
    ) -> Result<u64, String> {
        let target_bytes = (target_kb as u64) * 1024;
        let mut quality = initial_quality;
        let mut iterations = 0;
        const MAX_ITERATIONS: usize = 10;

        loop {
            // Save to temporary buffer
            let temp_path = format!("{}.tmp", path);
            let size = self.save_with_quality(img, &temp_path, format, quality)?;

            if size <= target_bytes || iterations >= MAX_ITERATIONS || quality <= 10 {
                // Accept this result
                fs::rename(&temp_path, path).map_err(|e| e.to_string())?;
                return Ok(size);
            }

            // Binary search adjustment
            if size > target_bytes {
                quality = quality.saturating_sub(10);
            }

            iterations += 1;
            let _ = fs::remove_file(&temp_path);
        }
    }
}
