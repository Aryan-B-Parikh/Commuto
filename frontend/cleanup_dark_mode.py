import os
import re

def remove_dark_classes(directory):
    # Pattern to match 'dark:' followed by any characters until a space, quote, or end of string
    # We want to remove the class and potential trailing space
    pattern = re.compile(r'\sdark:[^ "\']*|dark:[^ "\']*\s?')
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css', '.html')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub('', content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")

if __name__ == "__main__":
    target_dir = r"d:\Commuto\frontend\src"
    remove_dark_classes(target_dir)
