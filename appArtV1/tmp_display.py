with open('src/screens/activityUserPage.tsx', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 520 <= i <= 580:
            print(f"{i}: {line.rstrip()}")
