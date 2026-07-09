# Uploading Vaultarr to GitHub

## Recommended: GitHub Desktop

1. Clone your empty `vaultarr` repository using GitHub Desktop.
2. Extract this starter pack.
3. Copy everything from the extracted folder into the cloned repository folder.
4. In GitHub Desktop, review the changed files.
5. Commit with: `Initial Vaultarr release`.
6. Push to GitHub.

## Web uploader

GitHub's web uploader can be awkward with folders and hidden files.
If using the browser:

1. Extract this package.
2. Open the extracted folder.
3. Select the files and folders inside it, not the parent folder.
4. Drag them into GitHub's upload page.
5. If hidden files like `.github`, `.gitignore`, or `.env.example` do not upload, add them later with GitHub Desktop or Git.

## Git command line

```bash
git clone https://github.com/YOURNAME/vaultarr.git
cd vaultarr
# copy the starter pack contents here
git add .
git commit -m "Initial Vaultarr release"
git push
```
