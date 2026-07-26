cgpa = float(input("Enter your CGPA: "))

if cgpa > 0:
    percentage = (cgpa - 0.75)*10 
    print(f"Your equivalent percentage for the CGPA are:")
    print(f"{percentage} %")
else:
    print("CGPA cannot be negative")