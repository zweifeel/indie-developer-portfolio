import shutil

src = r'src\components\virtual-office\LemburIsometricPrototype.tsx'
dst = r'src\components\virtual-office\LemburIsometricPrototype.b342.backup.tsx'
shutil.copy2(src, dst)
print('Backup created successfully:', dst)
