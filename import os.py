import os
import re
import subprocess
import requests
import datetime
import json

# Optional dependencies for code formatting; install with:
# pip install autopep8 jsbeautifier beautifulsoup4
# pip install autopep8 jsbeautifier beautifulsoup4
try:
    import autopep8
except ImportError:
    autopep8 = None
try:
    import jsbeautifier
except ImportError:
    jsbeautifier = None
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None
    autopep8 = None
try:
    import jsbeautifier
except ImportError:
    jsbeautifier = None
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

class SupremeRepoBot:
    def __init__(self, github_username, github_token):
        self.username = github_username
        self.token = github_token
        self.session = requests.Session()
        self.session.auth = (github_username, github_token)
        self.base_url = "https://api.github.com"

    def create_repo(self, name, private=True, desc="Auto-created by SupremeRepoBot"):
        """Create a new GitHub repository or verify existing one."""
        res = self.session.post(
            f"{self.base_url}/user/repos",
            json={
                "name": name,
                "private": private,
                "description": desc,
                "auto_init": False,
                "has_issues": True,
                "has_projects": False
            }
        )
        if res.status_code == 201:
            print(f"Created repository '{name}' successfully.")
        elif res.status_code == 422 and "already exists" in res.text.lower():
            print(f"Repository '{name}' already exists. Proceeding to update.")
        else:
            raise Exception(f"Repo creation failed: {res.status_code} - {res.text}")

    def setup_local(self, name):
        """Initialize or update local repository."""
        try:
            if not os.path.exists(name):
                os.makedirs(name)
                os.chdir(name)
                subprocess.run(["git", "init"], check=True)
                subprocess.run(["git", "branch", "-M", "main"], check=True)
                subprocess.run(
                    ["git", "remote", "add", "origin", f"https://github.com/{self.username}/{name}.git"],
                    check=True
                )
            else:
                os.chdir(name)
                subprocess.run(["git", "fetch", "origin"], check=True)
                subprocess.run(["git", "checkout", "main"], check=False)
                subprocess.run(["git", "pull", "--rebase", "origin", "main"], check=False)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Local setup failed: {e}")

    def parse_blocks(self, raw):
        """Extract code blocks from raw text."""
        blocks = re.findall(r"```(?:\w+)?\n(.*?)\n```", raw, re.DOTALL)
        return [block.strip() for block in blocks if block.strip()]

    def detect_filetype(self, code, index):
        """Detect file type and assign appropriate path."""
        code = code.lower()
        patterns = [
            (r"import\s|def\s|class\s", "src/module_{}.py"),
            (r"<!doctype\s?html|<html", "static/page_{}.html"),
            (r"function\s|console\.log|=>", "static/script_{}.js"),
            (r"{\s*[\w-]+:.*?}", "static/style_{}.css"),
        ]
        for pattern, template in patterns:
            if re.search(pattern, code):
                return template.format(index)
        return f"misc/file_{index}.txt"

    def format_code(self, code, filetype):
        """Format code based on file type, with fallback if formatters are unavailable."""
        try:
            if filetype.endswith(".py") and autopep8:
                return autopep8.fix_code(code, options={'aggressive': 1})
            elif filetype.endswith(".js") and jsbeautifier:
                return jsbeautifier.beautify(code)
            elif filetype.endswith(".html") and BeautifulSoup:
                soup = BeautifulSoup(code, "html.parser")
                return soup.prettify()
            elif filetype.endswith(".css") and jsbeautifier:
                return jsbeautifier.beautify_css(code)
            return code  # Fallback to original code if no formatter available
        except Exception:
            return code  # Return original if formatting fails

    def write_blocks(self, blocks):
        """Write code blocks to appropriate files."""
        files = []
        for i, code in enumerate(blocks, 1):
            name = self.detect_filetype(code, i)
            os.makedirs(os.path.dirname(name), exist_ok=True)
            formatted_code = self.format_code(code, name)
            with open(name, "w", encoding="utf-8") as f:
                f.write(formatted_code)
            files.append(name)
        return files

    def generate_core_files(self, repo):
        """Generate essential repository files if missing."""
        files = []
        # README
        if not os.path.exists("README.md"):
            content = f"# {repo}\n\nAuto-generated by SupremeRepoBot\n\n## Setup\n```bash\ngit clone https://github.com/{self.username}/{repo}.git\n```"
            with open("README.md", "w", encoding="utf-8") as f:
                f.write(content)
            files.append("README.md")

        # LICENSE
        if not os.path.exists("LICENSE"):
            content = """MIT License

Copyright (c) {year} {username}

Permission is hereby granted, free of charge, to any person obtaining a copy...""".format(
                year=datetime.datetime.now().year,
                username=self.username
            )
            with open("LICENSE", "w", encoding="utf-8") as f:
                f.write(content)
            files.append("LICENSE")

        # .gitignore
        if not os.path.exists(".gitignore"):
            content = """__pycache__/
*.pyc
*.pyo
*.pyd
.env
.env.local
node_modules/
dist/
build/
*.log
.DS_Store
*.swp
"""
            with open(".gitignore", "w", encoding="utf-8") as f:
                f.write(content)
            files.append(".gitignore")

        return files

    def syntax_check(self, path):
        """Perform syntax check based on file type."""
        try:
            if path.endswith(".py"):
                return subprocess.run(
                    ["python3", "-m", "py_compile", path],
                    capture_output=True
                ).returncode == 0
            elif path.endswith(".js"):
                return subprocess.run(
                    ["node", "--check", path],
                    capture_output=True
                ).returncode == 0
            elif path.endswith(".html") and BeautifulSoup:
                soup = BeautifulSoup(open(path, encoding="utf-8"), "html.parser")
                return bool(soup.find())  # Basic HTML structure check
            elif path.endswith(".css"):
                return True  # CSS syntax check is complex; assume valid
            return True
        except Exception:
            return False

    def commit_and_push(self, message=None, files=None):
        """Commit changes and push to remote repository."""
        try:
            subprocess.run(["git", "add", "."], check=True)
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            default_msg = f"Auto-commit {now}"
            if files:
                default_msg += f" ({len(files)} files: {', '.join(os.path.basename(f) for f in files)})"
            commit_msg = message or default_msg
            subprocess.run(["git", "commit", "-m", commit_msg], check=True)
            subprocess.run(["git", "push", "-u", "origin", "main"], check=True)
            print(f"Committed and pushed: {commit_msg}")
        except subprocess.CalledProcessError as e:
            if "nothing to commit" in str(e.output):
                print("No changes to commit.")
            else:
                raise Exception(f"Commit/push failed: {e}")

    def handle_conflicts(self):
        """Attempt to resolve simple git conflicts."""
        try:
            status = subprocess.run(
                ["git", "status"],
                capture_output=True,
                text=True
            ).stdout
            if "both modified" in status:
                print("Conflict detected. Attempting auto-merge...")
                subprocess.run(["git", "pull", "--rebase"], check=False)
                subprocess.run(["git", "add", "."], check=True)
                subprocess.run(["git", "rebase", "--continue"], check=False)
                return True
            return False
        except subprocess.CalledProcessError:
            raise Exception("Conflict resolution failed. Please resolve manually.")

    def deploy(self, repo, raw, private=True, desc=None, msg=None):
        """Main deployment function."""
        try:
            self.create_repo(repo, private, desc or f"Auto-generated {repo}")
            self.setup_local(repo)
            
            # Parse and process code blocks
            blocks = self.parse_blocks(raw)
            if not blocks:
                raise ValueError("No valid code blocks found in input.")
            
            # Write code blocks and generate core files
            code_files = self.write_blocks(blocks)
            core_files = self.generate_core_files(repo)
            all_files = code_files + core_files

            # Syntax check
            for path in code_files:
                if not self.syntax_check(path):
                    raise Exception(f"Syntax error in {path}")

            # Check for conflicts
            self.handle_conflicts()

            # Commit and push
            self.commit_and_push(msg, all_files)
            print(f"Successfully deployed to https://github.com/{self.username}/{repo}")
        except Exception as e:
            raise Exception(f"Deployment failed: {str(e)}")

    def update_existing_file(self, repo, filepath, content):
        """Update a specific file in the repository."""
        try:
            self.setup_local(repo)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(self.format_code(content, filepath))
            if not self.syntax_check(filepath):
                raise Exception(f"Syntax error in updated file: {filepath}")
            self.commit_and_push(f"Update {os.path.basename(filepath)}")
            print(f"Updated {filepath} in {repo}")
        except Exception as e:
            raise Exception(f"File update failed: {str(e)}")

# Example usage:
# bot = SupremeRepoBot("your_username", "your_token")
# bot.deploy(
#     repo="my-awesome-repo",
#     raw="```python\nprint('Hello, World!')\n```\n```javascript\nconsole.log('Hello, World!');\n```",
#     private=True,
#     desc="My awesome project",
#     msg="Initial deployment with Python and JS"
# )
# bot.update_existing_file("my-awesome-repo", "src/module_1.py", "print('Updated Hello!')")