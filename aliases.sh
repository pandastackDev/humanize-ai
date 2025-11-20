# This script provides several utility functions for working with Git and GitHub:

# 1. gs() - Git Stage, Commit, and Push
#    Usage: gs [OPTIONAL_COMMIT_MESSAGE]
#    Automates staging changes, committing, and pushing to the remote repository.

# 2. ghpr() - Create a GitHub Pull Request
#    Usage: ghpr [OPTIONAL_PR_TITLE]
#    Automates creating a GitHub Pull Request, including staging changes, creating a new branch, committing, and pushing.

# 3. ghprai() - AI-assisted GitHub Pull Request Creation
#    Usage: ghprai [-y|--yes]
#    Creates a GitHub Pull Request with AI-generated content, including title and description.

# 4. ghprai_existing() - AI-assisted GitHub Pull Request Creation for Existing Branches
#    Usage: ghprai_existing
#    Creates a GitHub Pull Request with AI-generated content for an existing branch.

# 5. gsai() - AI-assisted Git Stage, Commit, and Push
#    Usage: gsai
#    Automates staging changes, creating a commit with an AI-generated commit message, and pushing changes.

# 6. chat_completion() - OpenAI Chat Completion Function
#    Usage: chat_completion "prompt" [MODEL] [REASONING_EFFORT]
#    Sends a prompt to OpenAI's API and returns the generated response.

# Note: Some functions require the GitHub CLI (gh) to be installed and authenticated.

# export OPENAI_API_KEY="sk-xxxxxxx"

# OpenAI Chat Completion Function
chat_completion() {
    local prompt="$1"
    local model="${2:-gpt-5.1-codex-mini}"  # Default model if not provided
    local reasoning_effort="${3:-low}"  # Default reasoning effort if not provided

    if [[ -z "$OPENAI_API_KEY" ]]; then
        echo "Error: OPENAI_API_KEY is not set."
        return 1
    fi

    local use_responses_endpoint=false
    local endpoint="https://api.openai.com/v1/chat/completions"
    local request_body

    if [[ "$model" == "gpt-5.1-codex-mini" ]]; then
        use_responses_endpoint=true
        endpoint="https://api.openai.com/v1/responses"
        request_body=$(jq -n \
            --arg model "$model" \
            --arg content "$prompt" \
            --arg reasoning_effort "$reasoning_effort" \
            '{
                model: $model,
                input: [
                    {
                        role: "user",
                        content: [
                            { type: "input_text", text: $content }
                        ]
                    }
                ],
                reasoning: { effort: $reasoning_effort }
            }')
    else
        request_body=$(jq -n \
            --arg model "$model" \
            --arg role "user" \
            --arg content "$prompt" \
            '{model: $model, messages: [{role: $role, content: $content}]}')
    fi

    local raw_response
    raw_response=$(curl -s "$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d "$request_body")

    local api_error
    api_error=$(echo "$raw_response" | jq -r '.error.message // empty')
    if [[ -n "$api_error" ]]; then
        echo "Error from OpenAI API: $api_error"
        return 1
    fi

    local response
    if [[ "$use_responses_endpoint" = true ]]; then
        response=$(echo "$raw_response" | jq -r '.output[] | select(.type=="message") | .content[] | select(.type=="output_text") | .text' | head -n 1)
    else
        response=$(echo "$raw_response" | jq -r '.choices[0].message.content // empty')
    fi

    if [[ -z "$response" || "$response" == "null" ]]; then
        echo "Error: Could not extract response text from OpenAI output."
        echo "$raw_response"
        return 1
    fi

    echo "$response"
}


unalias gwt 2>/dev/null
gwt() {
  # gwt - Git Worktree Management
  # Usage: gwt <branch-name>
  #
  # This function intelligently manages git worktrees based on your current location:
  #
  # SCENARIO 1: Called from main repository (e.g., /zeta)
  #   - Creates a new worktree in a sibling directory (e.g., /zeta-my-feature)
  #   - Handles three branch cases:
  #     * Branch exists locally: Uses the existing local branch
  #     * Branch exists on remote: Checks out from origin/<branch-name>
  #     * Branch doesn't exist: Creates new branch from main
  #   - Copies .env and .env.local files to the new worktree
  #   - Installs dependencies (pnpm i in frontend, uv sync --dev in backend)
  #   - Opens the new worktree in Cursor
  #   - You remain in the original directory after execution
  #
  # SCENARIO 2: Called from within an existing worktree (e.g., /zeta-my-feature)
  #   - Switches branches in-place (no new worktree created)
  #   - Fetches the branch from remote if needed
  #   - If branch exists on remote: Checks out origin/<branch-name>
  #   - If branch doesn't exist: Creates new branch from origin/main
  #   - The current worktree directory just switches to the new branch
  #   - No dependency installation or Cursor opening
  #
  # Examples:
  #   gwt my-feature     # From /zeta → creates /zeta-my-feature
  #   gwt another-task   # From /zeta-my-feature → switches to another-task branch in-place
  
  if [ -z "$1" ]; then
    echo "Usage: gwt <branch-name>"
    return 1
  fi

  # Branch name
  local branch=$1
  local sanitized_branch=${branch//\//-}

  # Find the absolute repo root
  local repo_root
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "❌ Not inside a git repo"
    return 1
  }

  local git_dir
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || return 1
  local git_common_dir
  git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || return 1

  # Normalize both to absolute paths for comparison
  # (git may return relative paths when run from subdirectories)
  git_dir=$(cd "$git_dir" && pwd)
  git_common_dir=$(cd "$git_common_dir" && pwd)

  # Check if we're in a worktree by comparing git_dir and git_common_dir
  # In main repo: they're the same
  # In worktree: git_dir points to .git/worktrees/<name>, git_common_dir points to main .git
  local is_worktree=false
  if [ "$git_dir" != "$git_common_dir" ]; then
    is_worktree=true
  fi

  if [ "$is_worktree" = true ]; then
    echo "ℹ️ Detected existing git worktree at $repo_root. Creating branch in-place."

    if git rev-parse --verify "$branch" >/dev/null 2>&1; then
      echo "❌ Branch $branch already exists locally."
      return 1
    fi

    git fetch origin main "$branch" >/dev/null 2>&1 || true

    if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
      if git switch -C "$branch" "origin/$branch" >/dev/null 2>&1; then
        git branch --set-upstream-to="origin/$branch" "$branch" >/dev/null 2>&1 || true
        echo "✅ Checked out existing origin/$branch inside worktree"
        return 0
      fi
      if git checkout -B "$branch" "origin/$branch" >/dev/null 2>&1; then
        git branch --set-upstream-to="origin/$branch" "$branch" >/dev/null 2>&1 || true
        echo "✅ Checked out existing origin/$branch inside worktree"
        return 0
      fi
      echo "❌ Unable to switch to origin/$branch"
      return 1
    fi

    if git switch -C "$branch" origin/main >/dev/null 2>&1; then
      echo "✅ Created branch $branch from origin/main inside worktree"
      return 0
    fi

    if git checkout -B "$branch" origin/main >/dev/null 2>&1; then
      echo "✅ Created branch $branch from origin/main inside worktree"
      return 0
    fi

    echo "❌ Failed to create branch $branch from origin/main"
    return 1
  fi

  # Worktree directory (sibling of repo root)
  local worktree_dir="$(dirname "$repo_root")/$(basename "$repo_root")-$sanitized_branch"

  if [ -d "$worktree_dir" ]; then
    echo "❌ Worktree directory already exists at $worktree_dir"
    return 1
  fi

  git -C "$repo_root" fetch origin "$branch" >/dev/null 2>&1 || true

  local add_args=()
  local branch_from_remote=false
  if git -C "$repo_root" rev-parse --verify "$branch" >/dev/null 2>&1; then
    add_args=("$worktree_dir" "$branch")
  elif git -C "$repo_root" ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    add_args=("-b" "$branch" "$worktree_dir" "origin/$branch")
    branch_from_remote=true
  else
    echo "ℹ️ Branch $branch does not exist locally or on origin. Creating from main."
    add_args=("-b" "$branch" "$worktree_dir" "main")
  fi

  # Create worktree + ensure branch exists, then open in Cursor
  if git -C "$repo_root" worktree add "${add_args[@]}"; then
    if [ "$branch_from_remote" = true ]; then
      git -C "$worktree_dir" branch --set-upstream-to="origin/$branch" "$branch" >/dev/null 2>&1 || true
    fi
    git -C "$worktree_dir" pull --ff-only >/dev/null 2>&1 || true
    local env_source="$repo_root/backend/.env"
    local env_target="$worktree_dir/backend/.env"

    if [ -f "$env_source" ]; then
      mkdir -p "$(dirname "$env_target")"
      cp "$env_source" "$env_target"
      echo "✅ Copied backend/.env to new worktree"
    else
      echo "⚠️ backend/.env not found at $env_source"
    fi

    local copied_any_env_local=false
    while IFS= read -r env_local_source; do
      copied_any_env_local=true
      local rel_path="${env_local_source#$repo_root/}"
      local env_local_target="$worktree_dir/$rel_path"
      mkdir -p "$(dirname "$env_local_target")"
      cp "$env_local_source" "$env_local_target"
      echo "✅ Copied $rel_path"
    done < <(find "$repo_root" -type f -name '.env.local' -not -path '*/.git/*')

    if [ "$copied_any_env_local" = false ]; then
      echo "ℹ️ No .env.local files found to copy"
    fi

    # Install dependencies
    echo "📦 Installing dependencies..."
    
    if [ -d "$worktree_dir/frontend" ]; then
      echo "  → Running pnpm i in frontend (and building @jace/ui styles)..."
      (cd "$worktree_dir/frontend" && pnpm i && pnpm --filter @jace/ui build) &
      local pnpm_pid=$!
    fi
    
    if [ -d "$worktree_dir/backend" ]; then
      echo "  → Running uv sync --dev in backend..."
      (cd "$worktree_dir/backend" && uv sync --dev) &
      local uv_pid=$!
    fi
    
    # Wait for both to complete
    if [ -n "${pnpm_pid:-}" ]; then
      wait $pnpm_pid && echo "  ✅ Frontend dependencies installed"
    fi
    if [ -n "${uv_pid:-}" ]; then
      wait $uv_pid && echo "  ✅ Backend dependencies installed"
    fi

    cursor "$worktree_dir"
  fi
}

# AI-assisted GitHub Pull Request Function
ghprai() {
    # ghprai - AI-assisted GitHub Pull Request Creation
    # Usage: ghprai [-y|--yes]
    #
    # This function automates the process of creating a GitHub Pull Request with AI-generated content.
    # It stages changes, creates a new branch if needed, commits changes, pushes to remote,
    # and creates a PR with AI-generated title and description.
    #
    # Parameters:
    #   -y, --yes: Run in non-interactive mode, automatically confirming prompts and selecting "do nothing" option
    #   user_prefix: Prefix for new branch names (default: "pet")
    #   model: AI model to use for generating content (default: "o3-mini")
    #   base_branch: The branch to create the PR against (default: "main")
    #   number_of_files: Number of top changed files to consider (default: 8)
    #   surrounding_lines: Number of context lines to include in diff (default: 5)
    #   last_n_lines: Maximum number of lines to consider from each file's diff (default: 100)
    #
    # Note: Ensure you're logged into GitHub CLI before using this function.

    # Check for non-interactive flag
    local non_interactive=false
    if [[ "$1" == "-y" || "$1" == "--yes" ]]; then
        non_interactive=true
        shift
    fi

    local user_prefix="vadym"

    local model="gpt-5.1-codex-mini"
    local base_branch="main"
    local number_of_files=8
    local surrounding_lines=5
    local last_n_lines=300

    # Get the root directory of the git repository
    local repo_root
    repo_root=$(git rev-parse --show-toplevel)
    echo "Repo root: $repo_root"

    # Check if there are changes to be staged
    if [[ -z $(git status --porcelain) ]]; then
        echo "No changes to be staged. Exiting. ❌"
        return 1
    fi

    # Check if logged into GitHub CLI
    if ! gh auth status &>/dev/null; then
        echo "Error: You are not logged into the GitHub CLI. Please install the GitHub CLI if you haven't already. For macOS, you can install it using Homebrew with the command 'brew install gh'. After installation, log in using 'gh auth login'. ❌"
        return 1
    fi

    # Get current branch name
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # Get the top files with the most lines changed, including added and deleted files, excluding pnpm-lock.yaml and .lock files
    local top_files
    top_files=$(git status --porcelain | awk '{print $2}' | grep -vE 'pnpm-lock\.yaml|\.lock$' | head -n "$number_of_files")

    # Prepare the diff information
    local diff_info=""
    while read -r file; do
        local full_path="$repo_root/$file"
        diff_info+="<file_diff file_name=\"$file\">\n"
        
        if [[ -f "$full_path" ]]; then
            local file_status
            # Extract the first two characters for precise status
            file_status=$(git status --porcelain "$full_path" | awk '{print $1}')
            echo "Processing file: $full_path with status: $file_status"
            case $file_status in
                M)
                    # Handle modified files
                    diff_output=$(git diff -U"$surrounding_lines" -- "$full_path" | tail -n "$last_n_lines")
                    diff_info+="$diff_output\n"
                    echo "Added diff for modified file: $file"
                    ;;
                *)
                    # Handle new or untracked files
                    diff_info+="[New file]\n"
                    diff_info+="$(cat "$full_path")\n"
                    echo "Added new file content for: $file"
                    ;;
            esac
        else
            diff_info+="[File deleted]\n"
            echo "File deleted: $file"
        fi
        diff_info+="</file_diff>\n\n"
    done <<< "$top_files"

    # echo "Diff info: $diff_info"

    # Prepare the prompt for the AI
    local prompt="Based on the following git diff information, generate a concise and informative pull request title and description. If a new branch is needed, suggest a medium length (so we don't get conflicting branch names) branch name prefixed with '${user_prefix}-' containing only lowercase letters, numbers, and dashes (never any slashes or spaces or other special characters).

Diff information:
<diff_info>${diff_info}</diff_info>

Please provide your response in the following format only:
<description>
Should contain: 
1. Summarize the changes made in the PR in short form, and explain how they fit together. You can use subheadings to highlight key changes and use concise markdown formatting, including code blocks if helpful.
(Very important: Be concise and to the point, dont blabber about the obvious, and dont be verbose, and dont repeat yourself. Also leave out any sections that would not be usefull, or are obvious.) (This whole block will be used as a github PR description, so its formatting will need to work well in github. Never use multiline bullet points.)
</description>
<title>PR title here</title>
<branch_name>branch-name-here</branch_name>
Output only these 3 sections with xml tags, nothing else."

    # Get AI-generated content
    local ai_response
    ai_response=$(chat_completion "$prompt" "$model")

    # Extract title, description, and branch name from AI response
    local pr_title
    pr_title=$(echo "$ai_response" | sed -n 's:.*<title>\(.*\)</title>.*:\1:p')

    local pr_description
    pr_description=$(echo "$ai_response" | sed -n '/<description>/,/<\/description>/p' | sed '1d;$d')

    local suggested_branch_name
    suggested_branch_name=$(echo "$ai_response" | sed -n 's:.*<branch_name>\(.*\)</branch_name>.*:\1:p' | tr -d '\n' | tr '/' '-')

    # Validate extracted fields
    if [[ -z "$pr_title" || -z "$pr_description" || -z "$suggested_branch_name" ]]; then
        echo "Error: Failed to parse AI response. Please ensure the AI returns the expected format."
        echo "AI Response Received:"
        echo "$ai_response"
        return 1
    fi

    # Display AI-generated content for confirmation
    echo "AI-generated content:"
    echo "---------------------"
    echo "Title: $pr_title"
    echo "---------------------"
    echo "Description:"
    echo "$pr_description"
    echo "---------------------"
    if [ "$current_branch" = "$base_branch" ]; then
        echo "Suggested branch name: $suggested_branch_name"
        echo "---------------------"
    fi
    
    # Skip confirmation if in non-interactive mode
    local confirm="y"
    if [[ "$non_interactive" != true ]]; then
        echo "Proceed with the title and description? [Y/n]: 🔄"
        read confirm
    else
        echo "Running in non-interactive mode. Automatically proceeding with the title and description."
    fi
    
    if [[ $confirm =~ ^[Nn]$ ]]; then
        echo "Operation cancelled. ❌"
        return 0
    fi

    # Create and switch to a new branch if on base branch
    if [ "$current_branch" = "$base_branch" ]; then
        # Validate branch name format
        if [[ ! "$suggested_branch_name" =~ ^[a-z0-9-]+$ ]]; then
            echo "Error: Suggested branch name '$suggested_branch_name' is invalid. It must contain only lowercase letters, numbers, and dashes. ❌"
            return 1
        fi

        git checkout -b "$suggested_branch_name"
        echo "Checked out new branch '$suggested_branch_name'. 🌿"
        current_branch="$suggested_branch_name"
    fi

    # Stage all changes
    git add .
    echo "Staged all changes. ✅"

    # Commit changes
    git commit -m "$pr_title"
    echo "Committed changes with message: '$pr_title'. ✅"

    # Push the current branch to remote
    git push origin "$current_branch"
    echo "Branch '$current_branch' pushed to origin. 🚀"

    # Create pull request
    if pr_url=$(gh pr create --base "$base_branch" --head "$current_branch" --title "$pr_title" --body "$pr_description"); then
        echo "Pull request created successfully. 🎉"
        echo "Options:"
        echo "  [y] - Merge now"
        echo "  [a] - Add auto-merge label"
        echo "  [n] - Do nothing"
        
        # Skip option selection if in non-interactive mode
        if [[ "$non_interactive" != true ]]; then
            echo "Choose an option [y/a/N]: 🔄"
            read confirm
        else
            echo "Running in non-interactive mode. Automatically selecting 'Do nothing' option."
            confirm="n"
        fi
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            gh pr merge "$current_branch" --squash --delete-branch
            echo "Pull request squashed, merged and branch deleted. 🧹✅"
        elif [[ $confirm =~ ^[Aa]$ ]]; then
            gh pr edit --add-label "automerge"
            echo "Added automerge label to pull request. 🏷️✅"
            echo "Pull request URL: $pr_url"
        else
            echo "No action taken. ❌"
            echo "Pull request URL: $pr_url"
        fi
    else
        echo "Failed to create pull request. ❌"
        return 1
    fi
}

ghprai_existing() {
    # ghprai_existing - AI-assisted GitHub Pull Request Creation for Existing Branches
    # Usage: ghprai_existing

    local model="gpt-5.1-codex-mini"
    local base_branch="main"
    local number_of_files=8
    local surrounding_lines=5
    local last_n_lines=300

    # Current branch
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # Guard: not on base branch
    if [[ "$current_branch" == "$base_branch" ]]; then
        echo "You are on the '$base_branch' branch. Use 'ghprai' instead. ❌"
        return 1
    fi

    # Guard: no local changes
    if [[ -n $(git status --porcelain) ]]; then
        echo "You have unstaged or uncommitted changes. Please commit or stash them before using 'ghprai_existing'. ❌"
        return 1
    fi

    # Repo root
    local repo_root
    repo_root=$(git rev-parse --show-toplevel)

    # Changed files between base and current
    local changed_files
    changed_files=$(git diff --name-only "$base_branch".."$current_branch" | grep -vE 'pnpm-lock\.yaml|\.lock$' | sort)

    if [[ -z "$changed_files" ]]; then
        echo "No differences found between '$base_branch' and '$current_branch'. ❌"
        return 1
    fi

    # Heuristic top files (by status; quick and simple)
    local top_files
    top_files=$(git diff --name-status "$base_branch".."$current_branch" | grep -vE 'pnpm-lock\.yaml|\.lock$' | sort -rn | head -n "$number_of_files" | awk '{print $2}')

    # Build diff context
    local diff_info=""
    while IFS= read -r file; do
        local full_path="$repo_root/$file"
        diff_info+="<file_diff file_name=\"$file\">\n"
        if [[ -f "$full_path" ]]; then
            if git diff --name-status "$base_branch".."$current_branch" | grep "^A" | grep -q "$file"; then
                diff_info+="[New file]\n"
                diff_info+=$(tail -n "$last_n_lines" "$full_path")
            else
                diff_info+=$(git diff -U"$surrounding_lines" "$base_branch".."$current_branch" -- "$full_path" | tail -n "$last_n_lines")
            fi
        else
            diff_info+="[File deleted]"
        fi
        diff_info+="\n</file_diff>\n\n"
    done <<< "$top_files"

    # AI prompt
    local prompt="Based on the following git diff information between the '$base_branch' branch and the '$current_branch' branch, generate a concise and informative pull request title and description. The title should be a single line, and the description should be a well-formatted markdown text that summarizes the changes.

Diff information:
<diff_info>
$diff_info
</diff_info>

Please provide your response in the following format only:
<description>PR description here (nicely markdown formatted)</description>
<title>PR title here in Conventional Commits format</title>
Output only these 2 sections with XML tags, nothing else."

    # Get AI-generated content
    local ai_response
    ai_response=$(chat_completion "$prompt" "$model")

    # Extract title/description
    local pr_title
    pr_title=$(echo "$ai_response" | sed -n 's:.*<title>\(.*\)</title>.*:\1:p')

    local pr_description
    pr_description=$(echo "$ai_response" | sed -n '/<description>/,/<\/description>/p' | sed '1d;$d')

    if [[ -z "$pr_title" || -z "$pr_description" ]]; then
        echo "Error: Failed to parse AI response. Please ensure the AI returns the expected format."
        echo "AI Response Received:"
        echo "$ai_response"
        return 1
    fi

    echo "Ai Suggestions:"
    echo "---------------------"
    echo "Title: $pr_title"
    echo "---------------------"
    echo "Description:"
    echo "$pr_description"
    echo "---------------------"
    echo "Proceed with the title and description? [Y/n]: 🔄"
    read confirm
    if [[ $confirm =~ ^[Nn]$ ]]; then
        echo "Operation cancelled. ❌"
        return 0
    fi

    # Create PR
    if gh pr create --base "$base_branch" --head "$current_branch" --title "$pr_title" --body "$pr_description"; then
        echo "Pull request created successfully. 🎉"

        echo "Merge the pull request? [y/N]: 🔄"
        read confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then

            # --- NEW: Final safety checks before merge/cleanup ---
            # Re-check working tree is clean
            if [[ -n $(git status --porcelain) ]]; then
                echo "Working tree is dirty. Commit/stash before merging. ❌"
                return 1
            fi
            # Ensure branch has upstream and no unpushed commits
            local upstream
            if ! upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null); then
                echo "This branch has no upstream (not pushed). Please push first: git push -u origin \"$current_branch\" ❌"
                return 1
            fi
            local ahead_count
            ahead_count=$(git rev-list --count "$upstream"..HEAD)
            if [[ "$ahead_count" -gt 0 ]]; then
                echo "You have $ahead_count unpushed commit(s) on $current_branch. Push before merging/cleaning. ❌"
                return 1
            fi
            # --- end NEW ---

            gh pr merge "$current_branch" --squash --delete-branch
            echo "Pull request squashed, merged and branch deleted on remote. 🧹✅"

            # If we're working from a linked worktree, prepare a fresh branch from main.
            local current_root gitfile
            current_root=$(git rev-parse --show-toplevel)
            gitfile="$current_root/.git"

            if [[ -f "$gitfile" ]] && grep -q "^gitdir:" "$gitfile" 2>/dev/null; then
                echo "Detected linked worktree at: $current_root"
                echo "Fetching latest $base_branch from origin..."
                if git fetch origin "$base_branch"; then
                    local timestamp new_branch
                    timestamp=$(date +"%Y-%m-%d-%H%M%S")
                    new_branch="$base_branch-$timestamp"
                    if git checkout -b "$new_branch" "origin/$base_branch"; then
                        echo "Checked out new branch '$new_branch' from origin/$base_branch. 🌿"
                    else
                        echo "Failed to create branch '$new_branch' from origin/$base_branch. ❌"
                    fi
                else
                    echo "Failed to fetch origin/$base_branch. ❌"
                fi
            else
                echo "Not in a linked worktree; no post-merge branch adjustments needed."
            fi

        else
            echo "Pull request not merged. ❌"
        fi
    else
        echo "Failed to create pull request. ❌"
        return 1
    fi
}






gsai() {
    # gsai - AI-assisted Git Stage, Commit, and Push
    # Usage: gsai
    #
    # This function automates the process of staging changes, creating a commit with an AI-generated
    # commit message, and pushing the changes to the remote repository.
    #
    # Parameters:
    #   model: AI model to use for generating commit messages (default: "gpt-4o-mini")
    #   number_of_files: Number of top changed files to consider (default: 4)
    #   surrounding_lines: Number of context lines to include in diff (default: 3)
    #   last_n_lines: Maximum number of lines to consider from each file's diff (default: 30)
    #
    # Note: This function attempts to pull changes before pushing. If there are conflicts,
    # you'll need to resolve them manually.

    # fast but less context and less accurate
    local model="gpt-5.1-codex-mini"
    local number_of_files=4
    local surrounding_lines=3
    local last_n_lines=60

    # Get the root directory of the git repository
    local repo_root
    repo_root=$(git rev-parse --show-toplevel)

    # Pull changes from the remote repository
    if ! git pull --ff-only; then
        echo "❌ Failed to pull changes. Please resolve conflicts manually."
        return 1
    fi

    # Check for unstaged changes
    if ! git diff --quiet; then
        git add -A
        echo "📦 Changes staged."
    else
        echo "🚫 No changes to stage."
        return 0
    fi

    # Check for staged changes
    if ! git diff --cached --quiet; then
        # Get the top files with the most lines changed, excluding pnpm-lock.yaml and .lock files
        local top_files
        top_files=$(git diff --cached --name-only | grep -vE 'pnpm-lock\.yaml|\.lock$' | head -n "$number_of_files")

        # Prepare the diff information
        local diff_info=""
        while read -r file; do
            local full_path="$repo_root/$file"
            diff_info+="<file_diff file_name=\"$file\">\n"
            if [[ -f "$full_path" ]]; then
                if git diff --cached --name-status | grep "^A" | grep -q "$file"; then
                    # New file, show its content and indicate it's new
                    diff_info+="[New file]\n"
                    diff_info+=$(tail -n "$last_n_lines" "$full_path")
                else
                    # File exists and was modified, show diff
                    diff_info+=$(git diff --cached -U"$surrounding_lines" -- "$full_path" | tail -n "$last_n_lines")
                fi
            else
                # File was deleted
                diff_info+="[File deleted]"
            fi
            diff_info+="\n</file_diff>\n\n"
        done <<< "$top_files"

        # Prepare the prompt for the AI
        local prompt="Based on the following git diff information, generate a concise and informative commit message in Conventional Commits format:

Diff information:
<diff_info>${diff_info}</diff_info>

Now generate a commit message in Conventional Commits format. Output nothing else but the commit message."

        # echo "Prompt: $prompt"
        # Get AI-generated commit message (use minimal reasoning effort for speed)
        local commit_message=$(chat_completion "$prompt" "$model" "minimal")

        # Commit changes with the AI-generated message
        git commit -m "$commit_message"
        echo "✅ Changes committed with message:"
        echo -e "$commit_message"
    else
        echo "🚫 No changes to commit."
        return 0
    fi

    # Push local commits to the remote repository
    if git push; then
        echo "🚀 Changes pushed successfully."
    else
        echo "❌ Failed to push changes."
        return 1
    fi
}


function ghpr() {
    # ghpr - Create a GitHub Pull Request
    # Usage: ghpr [OPTIONAL_PR_TITLE]
    #
    # This function automates the process of creating a GitHub Pull Request.
    # It stages changes, creates a new branch, commits changes, pushes to remote,
    # and creates a PR. Optionally, it can merge the PR if confirmed.
    #
    # Parameters:
    #   base_branch: The branch to create the PR against (default: "main")
    #   user_prefix: Prefix for new branch names (default: "pet")
    #
    # Examples:
    #   ghpr "Add new feature"
    #   ghpr  # Uses "..." as the default PR title
    #
    # Note: Ensure you're logged into GitHub CLI before using this function.

    local base_branch="main"
    local user_prefix="vadym"
    local pr_title="${1:-...}"
    
    # Get the file with the most line changes
    local most_changed_file=$(git diff --numstat | sort -rn | head -n1 | awk '{print $3}' | xargs basename)
    
    # Create a branch name based on the most changed file and current date
    sanitized_file_name=$(echo "${most_changed_file%.*}" | tr -c 'A-Za-z0-9-' '-')
    local branch_name="${user_prefix}-${sanitized_file_name}-$(date +%Y-%m-%d-time-%H-%M)"

    # Check if logged into GitHub CLI
    if ! gh auth status; then
        echo "Error: You are not logged into the GitHub CLI. Please install the GitHub CLI if you haven't already. For macOS, you can install it using Homebrew with the command 'brew install gh'. After installation, log in using 'gh auth login'. ❌"
        return 1
    fi

    # Check for unstaged changes and stage them
    if ! git diff --quiet; then
        git add .  # Stage all unstaged changes
        echo "Staged changes. ✅"
    fi

    # Check for uncommitted changes in the staging area
    if ! git diff --cached --quiet; then
        git checkout -b "$branch_name"  # Create and switch to a new branch
        echo "Checked out new branch '$branch_name'. 🌿"
        git commit -m "$pr_title"  # Commit changes with the provided title
        echo "Committed changes with message: '$pr_title'. ✅"
        git push origin "$branch_name"  # Push the new branch to remote
        echo "Branch '$branch_name' pushed to origin. 🚀"
    else
        echo "No changes to commit. 🚫"
        return 1
    fi

    # Create pull request
    if gh pr create --base "$base_branch" --head "$branch_name" --title "$pr_title" --body ""; then
        echo "Pull request created successfully. 🎉"
        echo "Merge the pull request? [y/N]: 🔄"
        read confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            gh pr merge "$branch_name" --squash --delete-branch  # Merge PR, squash commits, and delete branch
            echo "Pull request squashed, merged and branch deleted. 🧹✅"
        else
            echo "Pull request not merged. ❌"
        fi
    else
        echo "Failed to create pull request. ❌"
        return 1
    fi
}


function gs() {
    # gs - Git Stage, Commit, and Push
    # Usage: gs [OPTIONAL_COMMIT_MESSAGE]
    #
    # This function automates the process of staging changes, committing,
    # and pushing to the remote repository. If no commit message is provided,
    # it generates one based on the changed files.
    #
    # Examples:
    #   gs "Update user authentication"
    #   gs "Refactor database queries"
    #   gs  # Generates a commit message based on changed files
    #
    # Note: This function attempts to pull changes before pushing. If there are
    # conflicts, you'll need to resolve them manually.

    # Pull changes from the remote repository
    # --ff-only ensures we only do a fast-forward merge
    if ! git pull --ff-only; then
        # If git pull fails, print an error message and exit the function
        echo " Failed to pull changes. Please resolve conflicts manually."
        return 1
    fi

    # Check for unstaged changes in the working directory
    # git diff --quiet exits with 1 if there are differences
    if ! git diff --quiet; then
        # If there are unstaged changes, stage all changes in the project
        git add -A
        echo "📦 Changes staged."
    else
        # If there are no changes to stage, print a message and exit the function
        echo "🚫 No changes to stage."
        return 0
    fi

    # Check for staged changes
    # git diff --cached --quiet compares the staging area with the last commit
    if ! git diff --cached --quiet; then
        # If there are staged changes, proceed with commit
        
        # Check if a custom commit message was provided as an argument
        if [ $# -gt 0 ]; then
            commit_message="$*"
        else
            # If no commit message was provided, generate one based on changed files
            
            # Get list of changed files, sorted by number of lines changed
            changed_files=$(git diff --cached --numstat | sort -rn | awk '{print $3}' | sed 's/.*\///')
            # Count the number of changed files
            file_count=$(echo "$changed_files" | wc -l)
            
            if [ $file_count -le 3 ]; then
                # If 3 or fewer files changed, list all of them
                file_list=$(echo "$changed_files" | sed -e 's/^/- /' | tr '\n' ' ')
                commit_message="Updated: $file_list"
            else
                # If more than 3 files changed, list the first 3 and mention the count of others
                file_list=$(echo "$changed_files" | head -n 3 | sed -e 's/^/- /' | tr '\n' ' ')
                commit_message="Updated: $file_list(and $(($file_count - 3)) more files)"
            fi
        fi
        
        # Commit changes with the generated or provided message
        git commit -m "$commit_message"
        echo "✅ Changes committed with message:"
        echo -e "$commit_message"
    else
        # If there are no staged changes, print a message and exit the function
        echo "🚫 No changes to commit."
        return 0
    fi

    # Push local commits to the remote repository
    if git push; then
        # If push is successful, print a success message
        echo "🚀 Changes pushed successfully."
    else
        # If push fails, print an error message and exit the function with an error code
        echo "❌ Failed to push changes."
        return 1
    fi
}

# Fetch and Merge Main
# This function fetches the latest changes from the main branch on GitHub
# and merges those changes into the current branch.
#
# Usage: mm
#
# Note: This function will automatically check for uncommitted changes and abort if any are found.
mm() {
    # Abort if there are uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "🚫  Commit or stash your changes first."; return 1
    fi

    local current_branch
    current_branch=$(git symbolic-ref --quiet --short HEAD) || {
        echo "❌  Not on a branch."; return 1; }

    # 1. Update the remote-tracking branch
    git fetch --prune origin main || {
        echo "❌  Could not fetch origin/main."; return 1; }

    # 2. Fast-forward *local* main so it contains both remote and any local commits
    if git show-ref --verify --quiet refs/heads/main; then
        git branch --quiet --force main origin/main   # equivalent to fast-forward
    else
        git branch --quiet --track main origin/main
    fi

    # 3. If current branch already contains main, we are done
    if git merge-base --is-ancestor main "$current_branch"; then
        echo "☑️  $current_branch already has everything from main."; return 0
    fi

    # 4. Bring main in. Prefer a fast-forward; fall back to a normal merge.
    if ! git merge --ff-only main; then
        echo "🔀  Fast-forward impossible; creating a merge commit."
        git merge --no-edit main || { echo "❌  Merge conflicts – resolve manually."; return 1; }
    fi

    echo "✅  $current_branch is now up to date with main."
    
    # 5. Push if we're not on main
    if [[ "$current_branch" != "main" ]]; then
        echo "🚀  Pushing $current_branch to origin..."
        git push origin "$current_branch" || { echo "⚠️  Push failed, but merge was successful."; }
    fi
}


# Usage:
#   cpick-prod <sha-or-ref>
#   cpick-prod <sha1> <sha2> ...
#   cpick-prod <A^..B>              # range (inclusive)
#   cpick-prod                      # prompts interactively
#   cpick-prod --no-push <args...>  # cherry-pick but don't push

cpick-prod() {
  set -e

  # Optional flag to skip pushing
  local no_push=0
  if [[ "${1:-}" == "--no-push" ]]; then
    no_push=1
    shift
  fi

  git fetch --prune origin

  # short-lived branch off production
  local BR="cpick-to-prod-$(date +%Y%m%d%H%M%S)"
  git switch -c "$BR" origin/production

  # collect commits/ranges from args or prompt
  local commits=("$@")
  if [ ${#commits[@]} -eq 0 ]; then
    read -rp "Commit(s) to cherry-pick (SHA/ref or range like A^..B): " input
    # split input into array (allows multiple SHAs)
    # shellcheck disable=SC2206
    commits=($input)
  fi

  echo "Cherry-picking: ${commits[*]}"
  if git cherry-pick -x "${commits[@]}"; then
    echo "Cherry-pick applied."
  else
    echo "⚠️ Conflict encountered."
    echo "Resolve files, then run: git add <files> && git cherry-pick --continue"
    echo "Or abort: git cherry-pick --abort && git switch - && git branch -D \"$BR\""
    return 1
  fi

  if [ $no_push -eq 0 ]; then
    git push origin HEAD:production
    echo "✅ Pushed to production. Temporary branch: $BR"
    echo "You can delete it later with: git branch -D \"$BR\""
  else
    echo "✅ Cherry-pick ready on $BR. Skipping push (--no-push)."
    echo "Push when ready: git push origin HEAD:production"
  fi
}

# Find closest ancestor directory whose name contains "zeta"
_find_zeta_root() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    local base_name
    base_name=$(basename "$dir")
    if [[ "$base_name" == *"zeta"* ]]; then
      printf '%s' "$dir"
      return 0
    fi
    dir=$(dirname "$dir")
  done

  return 1
}

# td - Tauri Dev
# Usage: td
#
# This function runs the Tauri desktop app in development mode.
# If you're already in the desktop directory, it runs `pnpm tauri dev` directly.
# Otherwise, it finds the zeta root, navigates to frontend/apps/desktop, and runs the command.
td() {
  local current_dir
  current_dir=$(pwd)

  if [[ $(basename "$current_dir") == "desktop" ]]; then
    pnpm tauri dev
    return $?
  fi

  local zeta_root
  if ! zeta_root=$(_find_zeta_root); then
    echo "❌ Could not find a parent directory containing 'zeta'."
    return 1
  fi

  local target_dir="$zeta_root/frontend/apps/desktop"

  if [[ ! -d "$target_dir" ]]; then
    echo "❌ Desktop directory not found at $target_dir."
    return 1
  fi

  cd "$target_dir" || return 1
  pnpm tauri dev
}

# ms - Modal Serve
# Usage: ms
#
# This function runs the Modal backend in development mode.
# If you're already in the backend directory, it runs `modal serve -m infra.main` directly.
# Otherwise, it finds the zeta root, navigates to backend, and runs the command.
ms() {
  local current_dir
  current_dir=$(pwd)

  if [[ $(basename "$current_dir") == "backend" ]]; then
    modal serve -m infra.main
    return $?
  fi

  local zeta_root
  if ! zeta_root=$(_find_zeta_root); then
    echo "❌ Could not find a parent directory containing 'zeta'."
    return 1
  fi

  local target_dir="$zeta_root/backend"

  if [[ ! -d "$target_dir" ]]; then
    echo "❌ Backend directory not found at $target_dir."
    return 1
  fi

  cd "$target_dir" || return 1
  modal serve -m infra.main
}

# rd - Run Dev (Frontend App)
# Usage: rd
#
# This function runs the frontend web app in development mode.
# If you're already in the frontend directory, it runs `pnpm run dev:app` directly.
# Otherwise, it finds the zeta root, navigates to frontend, and runs the command.
unalias rd 2>/dev/null || true
rd() {
  local current_dir
  current_dir=$(pwd)

  if [[ $(basename "$current_dir") == "frontend" ]]; then
    pnpm run dev:app
    return $?
  fi

  local zeta_root
  if ! zeta_root=$(_find_zeta_root); then
    echo "❌ Could not find a parent directory containing 'zeta'."
    return 1
  fi

  local target_dir="$zeta_root/frontend"

  if [[ ! -d "$target_dir" ]]; then
    echo "❌ Frontend directory not found at $target_dir."
    return 1
  fi

  cd "$target_dir" || return 1
  pnpm run dev:app
}



# Switch to Main and Pull
# This function switches to the main branch and pulls the latest changes.
#
# Usage: gtm
#
# Note: This function will automatically check for uncommitted changes and abort if any are found.
function gtm() {
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "🚫 You have uncommitted changes. Please commit or stash them before switching branches."
        return 1
    fi

    # Switch to main branch
    if ! git checkout main; then
        echo "❌ Failed to switch to main branch."
        return 1
    fi

    # Pull latest changes
    if ! git pull origin main; then
        echo "❌ Failed to pull changes from main. Please check your network connection and try again."
        return 1
    fi

    echo "✅ Successfully switched to main and pulled latest changes."

    cd frontend
    pnpm i
}

