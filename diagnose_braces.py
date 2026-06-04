from pathlib import Path
text = Path(r'c:\Users\Dell\Desktop\AI\client\src\pages\Resume.jsx').read_text()
stack=[]
line=1
col=0
state=None
state_char=None
escaped=False
for i,ch in enumerate(text):
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        continue
    if state == 'str':
        if escaped:
            escaped = False
            continue
        if ch == '\\':
            escaped = True
            continue
        if ch == state_char:
            state = None
        continue
    if state == 'template':
        if escaped:
            escaped = False
            continue
        if ch == '\\':
            escaped = True
            continue
        if ch == '`':
            state = None
        continue
    if state == 'line_comment':
        if ch == '\n':
            state = None
        continue
    if state == 'block_comment':
        if ch == '*' and i + 1 < len(text) and text[i+1] == '/':
            state = None
        continue
    if ch == '/' and i + 1 < len(text) and text[i+1] == '/':
        state = 'line_comment'
        continue
    if ch == '/' and i + 1 < len(text) and text[i+1] == '*':
        state = 'block_comment'
        continue
    if ch in ('"', "'"):
        state = 'str'
        state_char = ch
        escaped = False
        continue
    if ch == '`':
        state = 'template'
        escaped = False
        continue
    if ch in '([{':
        stack.append((ch, line, col))
    elif ch in ')]}':
        if not stack:
            print('Unmatched closing', ch, 'at', line, col)
            break
        opening, ol, oc = stack.pop()
        if opening == '(' and ch != ')':
            print('Mismatched', opening, 'at', ol, oc, 'with', ch, line, col)
            break
        if opening == '[' and ch != ']':
            print('Mismatched', opening, 'at', ol, oc, 'with', ch, line, col)
            break
        if opening == '{' and ch != '}':
            print('Mismatched', opening, 'at', ol, oc, 'with', ch, line, col)
            break
else:
    if stack:
        print('Unmatched opening', stack[-1])
