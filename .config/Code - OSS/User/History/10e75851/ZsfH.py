
a = [1, 2, 3]
b = "You are a nigger"

num = int(input("Enter number: "))
counter = 0

if num in a:
    print(a)
    while counter < len(a):
        print(a[counter])
        counter ++
    
else:
    for x in a:
        print(b)