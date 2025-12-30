with open('src/screens/activityUserPage.tsx', encoding='utf-8') as f:
    for i,line in enumerate(f, 1):
        if 500 <= i <= 570:
            print(f"{i}: {line.rstrip()}")
