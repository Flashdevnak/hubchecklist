# Push this project to GitHub

Target repo:

```text
https://github.com/Flashdevnak/hubchecklist.git
```

## PowerShell commands

Open PowerShell in this project folder, then run:

```powershell
git init
git add .
git commit -m "MVP-001 project skeleton and Capacitor foundation"
git branch -M main
git remote add origin https://github.com/Flashdevnak/hubchecklist.git
git push -u origin main
```

If remote already exists:

```powershell
git remote set-url origin https://github.com/Flashdevnak/hubchecklist.git
git push -u origin main
```

If GitHub asks login, sign in with the account that owns `Flashdevnak/hubchecklist`.
