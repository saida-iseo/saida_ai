from PIL import Image, ImageDraw

# 1024x1024 icon with gradient
img = Image.new('RGB', (1024, 1024), color='white')
draw = ImageDraw.Draw(img)

# Simple rectangle as placeholder
draw.rectangle([100, 100, 924, 924], fill='#3b82f6', outline='#1d4ed8', width=20)
draw.rectangle([200, 300, 824, 700], fill='#60a5fa')

# Save
img.save('icon.png')
print('Icon created')
