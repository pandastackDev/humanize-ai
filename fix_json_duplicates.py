#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

def fix_json_file(file_path):
    """Fix JSON file that has duplicate arrays by keeping only the first valid array."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse as JSON first
        try:
            data = json.loads(content)
            # If it parses successfully and is a list with one item, it's already correct
            if isinstance(data, list) and len(data) == 1:
                return False  # No fix needed
        except json.JSONDecodeError:
            pass
        
        # Find the first complete JSON array
        lines = content.split('\n')
        bracket_count = 0
        brace_count = 0
        in_string = False
        escape_next = False
        start_idx = 0
        end_idx = 0
        
        for i, line in enumerate(lines):
            for char in line:
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\':
                    escape_next = True
                    continue
                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                
                if char == '[':
                    if bracket_count == 0:
                        start_idx = i
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_idx = i
                        # Found first complete array, extract it
                        fixed_content = '\n'.join(lines[start_idx:end_idx+1])
                        try:
                            # Validate it's valid JSON
                            json.loads(fixed_content)
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(fixed_content + '\n')
                            return True
                        except json.JSONDecodeError:
                            continue
        
        # If we couldn't find a valid array, try a simpler approach:
        # Find the first occurrence of `[` and the first matching `]` after it
        first_bracket = content.find('[')
        if first_bracket == -1:
            return False
        
        bracket_count = 0
        for i in range(first_bracket, len(content)):
            if content[i] == '[':
                bracket_count += 1
            elif content[i] == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    fixed_content = content[first_bracket:i+1]
                    try:
                        json.loads(fixed_content)
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(fixed_content + '\n')
                        return True
                    except json.JSONDecodeError:
                        break
        
        return False
    except Exception as e:
        print(f"Error fixing {file_path}: {e}", file=sys.stderr)
        return False

def main():
    datasets_dir = Path("backend/eval/datasets")
    if not datasets_dir.exists():
        print(f"Error: {datasets_dir} does not exist", file=sys.stderr)
        sys.exit(1)
    
    fixed_count = 0
    total_files = 0
    
    for json_file in datasets_dir.rglob("*.json"):
        total_files += 1
        if fix_json_file(json_file):
            fixed_count += 1
            print(f"Fixed: {json_file}")
    
    print(f"\nFixed {fixed_count} out of {total_files} files")

if __name__ == "__main__":
    main()
