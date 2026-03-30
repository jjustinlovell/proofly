Get-ChildItem -Path "proofly_app" -Force | Move-Item -Destination "." -Force
Remove-Item -Path "proofly_app" -Recurse -Force
