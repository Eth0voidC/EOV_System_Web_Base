#!/usr/bin/env bash
# =============================================================================
# export_project.sh  (v2)
#
# Run from your project ROOT (e.g. EOV_System_Web_Base):
#     bash export_project.sh
#
# Produces ONE text file (default: project_export.txt) with:
#    1. Project overview (git info, tech stack, stats)
#    2. Folder structure
#    3. Architecture layers (components / pages / services / routes ...)
#    4. Packages and dependencies (every package.json)
#    5. Environment variable NAMES (values are never exported)
#    6. Coding patterns and conventions (auto-detected)
#    7. Representative code samples (style reference)
#    8. Database and API map (SQL, tables used in code, endpoints, routes)
#    9. Dependency graph between your own files (+ possibly unused files)
#   10. File inventory (lines, size)
#   11. TODO / FIXME list
#   12. Per-file report + full source code of every file
#
# Options:
#    -o, --output FILE     output file name            (default project_export.txt)
#        --max-size BYTES  truncate files bigger than this (default 200000)
#        --no-contents     analysis only, do not dump source code
#        --no-redact       do NOT mask passwords/tokens in dumped code
#    -h, --help
#
# Works with bash 3.2+ (macOS, Linux, Git Bash on Windows). No extra tools
# required; `node` and `tree` are used automatically when available.
# =============================================================================

export LC_ALL=C

OUTPUT="project_export.txt"
MAX_FILE_BYTES=200000
TRUNCATE_LINES=300
REDACT=true
INCLUDE_CONTENTS=true

# Folders never entered
EXCLUDE_DIRS=(node_modules .git dist dist-ssr build coverage .next .nuxt .cache
              .parcel-cache .vscode .idea __pycache__ venv .venv .turbo .svelte-kit)

# Tables of the EOV database. Edit this list for other projects.
KNOWN_TABLES=(User Roles Employee Employment_Status Account_Status
              Product_Category Product_Item Employee_Transaction Transaction_Detail
              Employee_Balance Delivery Delivery_Detail Employee_Deduction
              Employee_Transaction_Archive Transaction_Detail_Archive)

usage() { sed -n '3,30p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
    case "$1" in
        -o|--output)   [ -n "$2" ] || { echo "Missing value for $1" >&2; exit 1; }
                       OUTPUT="$2"; shift 2;;
        --max-size)    [ -n "$2" ] || { echo "Missing value for $1" >&2; exit 1; }
                       MAX_FILE_BYTES="$2"; shift 2;;
        --no-contents) INCLUDE_CONTENTS=false; shift;;
        --no-redact)   REDACT=false; shift;;
        -h|--help)     usage; exit 0;;
        *) echo "Unknown option: $1" >&2; usage; exit 1;;
    esac
done

OUT_BASE="${OUTPUT##*/}"
TMP=$(mktemp -d 2>/dev/null || mktemp -d -t exportproj)
trap 'rm -rf "$TMP"' EXIT
Q="[\"']"                      # a quote character class, used in patterns

PRUNE=()
first=true
for d in "${EXCLUDE_DIRS[@]}"; do
    if $first; then PRUNE=(-name "$d"); first=false; else PRUNE+=(-o -name "$d"); fi
done

log() { echo "$*" >&2; }

# ----------------------------------------------------------------------------
# Redaction rules (sed script kept in a file to avoid quoting trouble)
# ----------------------------------------------------------------------------
SEDF="$TMP/redact.sed"
cat > "$SEDF" <<'EOF'
s/([A-Za-z_]*([Pp]ass(word|wd)?|PASS(WORD|WD)?|[Ss]ecret|SECRET|[Tt]oken|TOKEN|[Aa]pi[_-]?[Kk]ey|API[_-]?KEY)["']?[[:space:]]*[:=][[:space:]]*)["'][^"']{3,}["']/\1"<REDACTED>"/g
s#(://[^:/@ ]+:)[^@/ ]+@#\1<REDACTED>@#g
EOF
emit() { if $REDACT; then sed -E -f "$SEDF"; else cat; fi; }

# ----------------------------------------------------------------------------
# Small helpers
# ----------------------------------------------------------------------------
lines_of() { wc -l < "$1" | tr -d ' '; }
bytes_of() { wc -c < "$1" | tr -d ' '; }
lower_ext() { local b="${1##*/}"; case "$b" in *.*) printf '%s' "${b##*.}" | tr 'A-Z' 'a-z';; esac; }
section() { echo; echo "================================================================"; echo " $1"; echo "================================================================"; }
sub()     { echo; echo "--- $1 ---"; }
pct()     { if [ "$2" -gt 0 ]; then echo $((100 * $1 / $2)); else echo 0; fi; }
row()     { printf '  %-38s %s\n' "$1" "$2"; }

# grep over a list of files (one path per line). $1=flags (E, Ei...) $2=pattern $3=listfile
grep_all()   { [ -s "$3" ] || return 0; tr '\n' '\0' < "$3" | xargs -0 grep -nH"$1" -- "$2" 2>/dev/null; }
grep_oh()    { [ -s "$3" ] || return 0; tr '\n' '\0' < "$3" | xargs -0 grep -oh"$1" -- "$2" 2>/dev/null; }
grep_files() { [ -s "$3" ] || return 0; tr '\n' '\0' < "$3" | xargs -0 grep -l"$1" -- "$2" 2>/dev/null; }

role_of() {
    case "$1" in
        *.test.*|*.spec.*|*/__tests__/*|*/tests/*|*/test/*) echo "Test";;
        */components/*|*/component/*)                       echo "UI component";;
        */pages/*|*/views/*|*/screens/*)                    echo "Page / view";;
        */hooks/*)                                          echo "Custom hook";;
        */context/*|*/contexts/*|*/store/*|*/redux/*|*/state/*) echo "State management";;
        */services/*|*/api/*)                               echo "API / service layer";;
        */controllers/*)                                    echo "Controller";;
        */models/*)                                         echo "Model / data access";;
        */routes/*|*/router/*)                              echo "Routing";;
        */middleware/*|*/middlewares/*)                     echo "Middleware";;
        */utils/*|*/helpers/*|*/lib/*)                      echo "Utility";;
        */config/*)                                         echo "Configuration";;
        */layouts/*|*/layout/*)                             echo "Layout";;
        */styles/*|*.css|*.scss|*.sass|*.less)              echo "Styling";;
        *.sql)                                              echo "Database script";;
        *vite.config.*|*tailwind.config.*|*postcss.config.*|*eslint*|*webpack.config.*|*tsconfig*|*jest.config.*) echo "Tooling config";;
        */main.js|*/main.jsx|*/main.ts|*/main.tsx|*/index.js|*/index.jsx|*/App.jsx|*/App.js|*/App.tsx|*/server.js|*/app.js) echo "Entry point";;
        *package.json)                                      echo "Package manifest";;
        *.md)                                               echo "Documentation";;
        *.html)                                             echo "HTML";;
        *)                                                  echo "Other";;
    esac
}

# ----------------------------------------------------------------------------
# Collect file lists
# ----------------------------------------------------------------------------
build_lists() {
    for n in all src js css html sql other env; do : > "$TMP/$n.txt"; done
    find . \( "${PRUNE[@]}" \) -prune -o -type f ! -name "$OUT_BASE" -print 2>/dev/null \
        | LC_ALL=C sort > "$TMP/all.txt"

    while IFS= read -r f; do
        base="${f##*/}"
        case "$base" in
            package-lock.json|yarn.lock|pnpm-lock.yaml|*.lock|*.min.js|*.min.css|*.map) continue;;
            .env.example|.env.sample|.env.template) echo "$f" >> "$TMP/src.txt"; continue;;
            .env|.env.*) echo "$f" >> "$TMP/env.txt"; continue;;
            Dockerfile|Makefile|.gitignore|.editorconfig|.prettierrc*|.eslintrc*|.babelrc)
                echo "$f" >> "$TMP/src.txt"; continue;;
        esac
        ext=$(lower_ext "$f")
        case "$ext" in
            js|jsx|ts|tsx|mjs|cjs|vue|svelte) echo "$f" >> "$TMP/js.txt";   echo "$f" >> "$TMP/src.txt";;
            css|scss|sass|less)               echo "$f" >> "$TMP/css.txt";  echo "$f" >> "$TMP/src.txt";;
            html|htm)                         echo "$f" >> "$TMP/html.txt"; echo "$f" >> "$TMP/src.txt";;
            sql)                              echo "$f" >> "$TMP/sql.txt";  echo "$f" >> "$TMP/src.txt";;
            php|py|java|cs|go|rb)             echo "$f" >> "$TMP/other.txt"; echo "$f" >> "$TMP/src.txt";;
            json|md|yml|yaml|toml|sh)         echo "$f" >> "$TMP/src.txt";;
        esac
    done < "$TMP/all.txt"

    # inventory: lines <TAB> bytes <TAB> path
    : > "$TMP/inv.tsv"
    while IFS= read -r f; do
        printf '%s\t%s\t%s\n' "$(lines_of "$f")" "$(bytes_of "$f")" "$f" >> "$TMP/inv.tsv"
    done < "$TMP/src.txt"

    # all JS-family code in a single file for fast pattern counting
    : > "$TMP/alljs.txt"
    while IFS= read -r f; do cat "$f" >> "$TMP/alljs.txt"; echo >> "$TMP/alljs.txt"; done < "$TMP/js.txt"

    # package.json files (outside node_modules) and their combined text
    find . \( "${PRUNE[@]}" \) -prune -o -type f -name package.json -print 2>/dev/null | sort > "$TMP/pkgs.txt"
    : > "$TMP/pkgall.txt"
    while IFS= read -r p; do cat "$p" >> "$TMP/pkgall.txt"; done < "$TMP/pkgs.txt"
}

ALLJS="$TMP/alljs.txt"
cnt()  { grep -cE "$1" "$ALLJS" 2>/dev/null; }
fcnt() { local n=0 f; while IFS= read -r f; do grep -qE "$1" "$f" 2>/dev/null && n=$((n + 1)); done < "$TMP/js.txt"; echo "$n"; }

# ----------------------------------------------------------------------------
# show: print matching lines (with line numbers) limited to N
# ----------------------------------------------------------------------------
_show() {  # flags label file limit pattern
    local flags="$1" label="$2" file="$3" limit="$4" pattern="$5" out total
    out=$(grep "$flags" -- "$pattern" "$file" 2>/dev/null | sed -E 's/^([0-9]+):[[:space:]]*/\1: /' | cut -c1-170)
    [ -z "$out" ] && return
    total=$(printf '%s\n' "$out" | wc -l | tr -d ' ')
    echo "  $label ($total):"
    printf '%s\n' "$out" | head -n "$limit" | sed 's/^/    L/'
    [ "$total" -gt "$limit" ] && echo "    ... +$((total - limit)) more"
    return 0
}
show()  { _show -nE  "$@"; }
showi() { _show -niE "$@"; }

# ----------------------------------------------------------------------------
# Per-file analysis
# ----------------------------------------------------------------------------
analyze_js() {
    local f="$1" hooks envs store
    show "Package imports" "$f" 40 "^[[:space:]]*import[[:space:]].*from[[:space:]]*${Q}[^./]|require\(${Q}[^./]"
    show "Local imports"   "$f" 40 "^[[:space:]]*import[[:space:]].*from[[:space:]]*${Q}\.|require\(${Q}\.|import\(${Q}\."
    show "Exports"         "$f" 25 '^[[:space:]]*(export[[:space:]]|module\.exports|exports\.)'
    show "Components / classes" "$f" 25 '^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(async[[:space:]]+)?(function|const|class)[[:space:]]+[A-Z][a-z][A-Za-z0-9_]*'
    show "Functions"       "$f" 30 '^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(async[[:space:]]+)?function[[:space:]*]+[a-z_$][A-Za-z0-9_$]*|^[[:space:]]*(export[[:space:]]+)?(const|let)[[:space:]]+[a-z_$][A-Za-z0-9_$]*[[:space:]]*=.*=>'
    hooks=$(grep -oE '(^|[^A-Za-z0-9_.])use[A-Z][A-Za-z0-9]*[(<]' "$f" 2>/dev/null | sed -E 's/^[^u]*//; s/[(<]$//' | sort | uniq -c | sort -rn | awk '{printf "%s(x%s) ", $2, $1}')
    [ -n "$hooks" ] && echo "  Hooks used: $hooks"
    show "Express routes"  "$f" 30 '(app|router|server)\.(get|post|put|patch|delete|all|use)[[:space:]]*\('
    show "HTTP calls"      "$f" 20 '(fetch|axios(\.[a-z]+)?|api\.(get|post|put|patch|delete)|\$\.ajax)[[:space:]]*\('
    show "React Router"    "$f" 20 '<Route[[:space:]]|createBrowserRouter|useNavigate\(|<Navigate'
    show "SQL statements"  "$f" 15 '(SELECT[[:space:]].*FROM|INSERT[[:space:]]+INTO|UPDATE[[:space:]]+[A-Za-z_`]+[[:space:]]+SET|DELETE[[:space:]]+FROM|CREATE[[:space:]]+TABLE|[[:space:]]JOIN[[:space:]])'
    envs=$(grep -oE 'import\.meta\.env\.[A-Z_]+|process\.env\.[A-Z_]+' "$f" 2>/dev/null | sort -u | tr '\n' ' ')
    [ -n "$envs" ] && echo "  Env vars read: $envs"
    store=$(grep -oE 'localStorage|sessionStorage|jsonwebtoken|bcrypt|Bearer' "$f" 2>/dev/null | sort | uniq -c | awk '{printf "%s(x%s) ", $2, $1}')
    [ -n "$store" ] && echo "  Auth / storage hints: $store"
    show "TODO / FIXME"    "$f" 10 '(TODO|FIXME|HACK|XXX)'
    echo "  Stats: console.log=$(grep -cE 'console\.log' "$f") try/catch=$(grep -cE 'try[[:space:]]*\{' "$f") async=$(grep -cE 'async[[:space:]]' "$f") await=$(grep -cE 'await[[:space:]]' "$f") comments=$(grep -cE '^[[:space:]]*(//|/\*|\*)' "$f")"
}

analyze_css() {
    local f="$1"
    echo "  Stats: rules=$(grep -c '{' "$f") custom-properties=$(grep -cE '^[[:space:]]*--' "$f") @media=$(grep -c '@media' "$f") @import=$(grep -c '@import' "$f") @tailwind/@apply=$(grep -cE '@(tailwind|apply)' "$f")"
    show "Custom properties" "$f" 15 '^[[:space:]]*--[a-zA-Z0-9-]+:'
}

analyze_html() {
    show "Title / assets" "$1" 15 '<title|<(script|link)[^>]*(src|href)='
}

analyze_sql() {
    local f="$1" seeds
    showi "Schema statements" "$f" 60 '(CREATE|ALTER|DROP)[[:space:]]+(TABLE|VIEW|PROCEDURE|FUNCTION|TRIGGER|INDEX|DATABASE)|PRIMARY[[:space:]]+KEY|FOREIGN[[:space:]]+KEY|REFERENCES'
    seeds=$(grep -oiE 'INSERT[[:space:]]+INTO[[:space:]]+[`"]?[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null | sed -E 's/^.*[[:space:]]+[`"]?//' | sort | uniq -c | awk '{printf "%s(x%s) ", $2, $1}')
    [ -n "$seeds" ] && echo "  INSERT statements by table: $seeds"
}

analyze_json() {
    local f="$1"
    case "${f##*/}" in package.json) return;; esac
    command -v node >/dev/null 2>&1 || return
    node -e 'try{const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("  Top-level: "+(Array.isArray(j)?"array["+j.length+"]":"keys -> "+Object.keys(j).slice(0,30).join(", ")))}catch(e){console.log("  (not strict JSON, e.g. has comments)")}' "$f"
}

analyze_file() {
    local f="$1"
    case "$(lower_ext "$f")" in
        js|jsx|ts|tsx|mjs|cjs|vue|svelte) analyze_js "$f";;
        css|scss|sass|less) analyze_css "$f";;
        html|htm)           analyze_html "$f";;
        sql)                analyze_sql "$f";;
        json)               analyze_json "$f";;
        md)                 show "Headings" "$f" 25 '^#{1,4}[[:space:]]';;
        sh)                 show "Functions" "$f" 20 '^[[:space:]]*(function[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*[[:space:]]*\(\)';;
        py)                 show "Definitions" "$f" 30 '^[[:space:]]*(def|class)[[:space:]]';;
        php)                show "Definitions" "$f" 30 '^[[:space:]]*(function|class)[[:space:]]';;
    esac
}

dump_file() {
    local f="$1" bytes lines maxlen
    lines=$(lines_of "$f"); bytes=$(bytes_of "$f")
    echo
    echo "################################################################"
    echo "FILE: $f"
    echo "Role: $(role_of "$f") | Lines: $lines | Size: $bytes bytes"
    echo "################################################################"
    analyze_file "$f"
    $INCLUDE_CONTENTS || return 0
    echo "  ----- BEGIN CONTENT -----"
    if [ ! -s "$f" ]; then
        echo "[empty file]"
    elif ! grep -Iq . "$f" 2>/dev/null; then
        echo "[binary file skipped]"
    else
        maxlen=$(awk '{ if (length($0) > m) m = length($0) } END { print m + 0 }' "$f")
        if [ "$maxlen" -gt 2000 ]; then
            echo "[skipped: very long lines, probably minified or generated]"
        elif [ "$bytes" -gt "$MAX_FILE_BYTES" ]; then
            head -n "$TRUNCATE_LINES" "$f" | emit
            echo "[truncated: first $TRUNCATE_LINES of $lines lines shown, file is $bytes bytes]"
        else
            emit < "$f"
        fi
    fi
    echo "  ----- END CONTENT -----"
}

# ----------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------
detect() { grep -qE "\"($2)\"" "$TMP/pkgall.txt" 2>/dev/null && echo "  [x] $1"; }

sec_overview() {
    section "1. PROJECT OVERVIEW"
    row "Project name"  "$(basename "$PWD")"
    row "Root path"     "$PWD"
    row "Generated"     "$(date '+%Y-%m-%d %H:%M:%S')"
    row "System"        "$(uname -s 2>/dev/null) | bash ${BASH_VERSION}"
    if command -v node >/dev/null 2>&1; then row "Node / npm" "$(node -v) / $(npm -v 2>/dev/null)"; fi

    sub "Statistics"
    local total src loc
    total=$(wc -l < "$TMP/all.txt" | tr -d ' ')
    src=$(wc -l < "$TMP/src.txt" | tr -d ' ')
    loc=$(awk -F'\t' '{s += $1} END {print s + 0}' "$TMP/inv.tsv")
    row "Files (excluding ignored dirs)" "$total"
    row "Source/config files analysed"   "$src"
    row "Total lines in those files"     "$loc"
    echo
    echo "  Lines of code by extension:"
    while IFS=$'\t' read -r l b f; do
        e=$(lower_ext "$f"); [ -z "$e" ] && e="(none)"
        printf '%s\t%s\n' "$e" "$l"
    done < "$TMP/inv.tsv" | awk -F'\t' '{n[$1]++; s[$1] += $2} END {for (k in n) printf "%s\t%d\t%d\n", k, n[k], s[k]}' \
        | sort -t$'\t' -k3 -rn | awk -F'\t' '{printf "    .%-8s %4d files %8d lines\n", $1, $2, $3}'

    sub "Detected tech stack (from package.json files)"
    if [ -s "$TMP/pkgall.txt" ]; then
        detect "React" 'react'
        detect "React Router" 'react-router-dom|react-router'
        detect "Vue" 'vue'
        detect "Vite" 'vite'
        detect "TypeScript" 'typescript'
        detect "Tailwind CSS" 'tailwindcss'
        detect "Bootstrap" 'bootstrap|react-bootstrap'
        detect "Material UI" '@mui/[a-z-]+'
        detect "Ant Design" 'antd'
        detect "Redux" 'redux|@reduxjs/toolkit'
        detect "Zustand" 'zustand'
        detect "Axios" 'axios'
        detect "Express" 'express'
        detect "MySQL" 'mysql|mysql2'
        detect "PostgreSQL" 'pg'
        detect "SQLite" 'sqlite3|better-sqlite3'
        detect "MongoDB / Mongoose" 'mongoose|mongodb'
        detect "Sequelize" 'sequelize'
        detect "Prisma" 'prisma|@prisma/client'
        detect "JWT" 'jsonwebtoken'
        detect "bcrypt" 'bcrypt|bcryptjs'
        detect "CORS" 'cors'
        detect "dotenv" 'dotenv'
        detect "Charts" 'recharts|chart.js|react-chartjs-2'
        detect "Form libs" 'formik|react-hook-form'
        detect "Validation" 'zod|yup|joi'
        detect "Testing" 'jest|vitest|@testing-library/react|cypress'
        detect "ESLint / Prettier" 'eslint|prettier'
    else
        echo "  (no package.json found)"
    fi

    sub "Git"
    if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        row "Branch"        "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
        row "Commits"       "$(git rev-list --count HEAD 2>/dev/null)"
        row "Uncommitted"   "$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') changed file(s)"
        echo "  Remotes:"
        git remote -v 2>/dev/null | sed -E 's#(://)[^@/]*@#\1<REDACTED>@#' | sed 's/^/    /' | head -4
        echo "  Last 10 commits:"
        git log --oneline -n 10 2>/dev/null | sed 's/^/    /'
        echo "  Top contributors:"
        git shortlog -sn --no-merges HEAD 2>/dev/null | head -5 | sed 's/^/    /'
    else
        echo "  (not a git repository)"
    fi
}

sec_tree() {
    section "2. FOLDER STRUCTURE"
    if command -v tree >/dev/null 2>&1; then
        local ign
        ign=$(IFS='|'; echo "${EXCLUDE_DIRS[*]}")
        tree -a -I "$ign|$OUT_BASE" --noreport
    else
        echo "."
        find . \( "${PRUNE[@]}" \) -prune -o ! -name "$OUT_BASE" -print 2>/dev/null | LC_ALL=C sort | while IFS= read -r p; do
            [ "$p" = "." ] && continue
            rel="${p#./}"; sl="${rel//[^\/]/}"; indent=""; i=0
            while [ "$i" -lt "${#sl}" ]; do indent="$indent|   "; i=$((i + 1)); done
            if [ -d "$p" ]; then echo "${indent}|-- ${rel##*/}/"; else echo "${indent}|-- ${rel##*/}"; fi
        done
    fi
}

sec_layers() {
    section "3. ARCHITECTURE LAYERS"
    sub "Files by role (guessed from folder/file names)"
    while IFS= read -r f; do role_of "$f"; done < "$TMP/src.txt" | sort | uniq -c | sort -rn | awk '{c=$1; $1=""; printf "  %4d  %s\n", c, substr($0,2)}'
    sub "Files per folder (top 2 levels)"
    awk -F/ '{ if (NF > 3) k = $2 "/" $3; else if (NF == 3) k = $2 "/"; else k = "./"; n[k]++ } END { for (k in n) printf "  %4d  %s\n", n[k], k }' "$TMP/src.txt" | sort -rn
}

sec_packages() {
    section "4. PACKAGES AND DEPENDENCIES"
    if [ ! -s "$TMP/pkgs.txt" ]; then echo "  (no package.json found)"; return; fi
    while IFS= read -r pj; do
        sub "$pj"
        if command -v node >/dev/null 2>&1; then
            node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const o = (t, x) => { const k = Object.keys(x || {}); if (!k.length) return;
  console.log("  " + t + " (" + k.length + "):"); k.forEach(n => console.log("    - " + n + " @ " + x[n])); };
console.log("  name: " + p.name + "   version: " + p.version + "   module type: " + (p.type || "commonjs"));
if (p.main) console.log("  main: " + p.main);
o("scripts", p.scripts); o("dependencies", p.dependencies);
o("devDependencies", p.devDependencies); o("peerDependencies", p.peerDependencies);
' "$pj" 2>/dev/null || sed 's/^/  /' "$pj"
        else
            sed 's/^/  /' "$pj"
        fi
    done < "$TMP/pkgs.txt"
}

sec_env() {
    section "5. ENVIRONMENT VARIABLES (names only, values hidden)"
    if [ -s "$TMP/env.txt" ]; then
        while IFS= read -r f; do
            echo "  $f"
            grep -E '=' "$f" | grep -vE '^[[:space:]]*#' \
                | sed -E 's/^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=.*/    \2 = <hidden>/'
        done < "$TMP/env.txt"
    else
        echo "  (no .env files found)"
    fi
    sub "Variables read in code"
    { grep_oh E 'import\.meta\.env\.[A-Z_]+|process\.env\.[A-Z_]+' "$TMP/js.txt"; } | sort | uniq -c | sort -rn | awk '{printf "    %-40s used %s time(s)\n", $2, $1}'
}

sec_patterns() {
    section "6. CODING PATTERNS AND CONVENTIONS (auto-detected)"
    local nfiles ts js esm cjs jsx fn cls tabs two four ind total_ind semi_y semi_n qs qd
    nfiles=$(wc -l < "$TMP/js.txt" | tr -d ' ')
    if [ "$nfiles" -eq 0 ]; then echo "  (no JS/TS files found)"; return; fi

    sub "Language and modules"
    ts=$(grep -cE '\.(ts|tsx)$' "$TMP/js.txt"); js=$((nfiles - ts))
    row "JS / TS files"            "$js JavaScript, $ts TypeScript"
    jsx=$(grep -cE '\.(jsx|tsx)$' "$TMP/js.txt")
    row "JSX / TSX files"          "$jsx"
    esm=$(fcnt '^[[:space:]]*(import[[:space:]]|export[[:space:]])')
    cjs=$(fcnt 'require\(|module\.exports')
    row "ES modules (import/export)" "$esm files"
    row "CommonJS (require)"       "$cjs files"

    sub "React patterns"
    fn=$(cnt '^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(function|const)[[:space:]]+[A-Z][a-z][A-Za-z0-9_]*')
    cls=$(cnt 'extends[[:space:]]+(React\.)?(Pure)?Component')
    row "Function components (approx.)" "$fn"
    row "Class components"         "$cls"
    row "export default / named"   "$(cnt '^[[:space:]]*export[[:space:]]+default') default, $(cnt '^[[:space:]]*export[[:space:]]+(const|function|class|async)') named"
    row "createContext usages"     "$(cnt 'createContext\(')"
    row "PropTypes usages"         "$(cnt 'PropTypes')"
    echo "  Most used hooks:"
    grep -oE '(^|[^A-Za-z0-9_.])use[A-Z][A-Za-z0-9]*[(<]' "$ALLJS" | sed -E 's/^[^u]*//; s/[(<]$//' | sort | uniq -c | sort -rn | head -15 | awk '{printf "    %-28s x%s\n", $2, $1}'
    echo "  Custom hooks defined:"
    grep -ohE '(function|const)[[:space:]]+use[A-Z][A-Za-z0-9]*' "$ALLJS" | awk '{print $2}' | sort -u | sed 's/^/    /'

    sub "Asynchronous / data fetching style"
    row "async functions"          "$(cnt 'async[[:space:]]')"
    row "await usages"             "$(cnt 'await[[:space:]]')"
    row ".then( chains"            "$(cnt '\.then\(')"
    row ".catch( handlers"         "$(cnt '\.catch\(')"
    row "try { } blocks"           "$(cnt 'try[[:space:]]*\{')"
    row "fetch( calls"             "$(cnt '(^|[^A-Za-z0-9_.])fetch\(')"
    row "axios usages"             "$(cnt 'axios')"

    sub "Syntax style"
    row "Arrow functions (lines with =>)" "$(cnt '=>')"
    row "function declarations"    "$(cnt '(^|[^A-Za-z0-9_])function[[:space:]*]')"
    row "const / let / var lines"  "$(cnt '^[[:space:]]*const[[:space:]]') / $(cnt '^[[:space:]]*let[[:space:]]') / $(cnt '^[[:space:]]*var[[:space:]]')"
    qs=$(cnt "from[[:space:]]+'"); qd=$(cnt 'from[[:space:]]+"')
    row "Quotes in imports"        "single=$qs double=$qd  -> $([ "$qs" -ge "$qd" ] && echo 'single quotes preferred' || echo 'double quotes preferred')"
    semi_y=$(grep -E '^[[:space:]]*(const|let|var|import|export|return|await|throw)[[:space:]]' "$ALLJS" | grep -cE ';[[:space:]]*$')
    semi_n=$(grep -E '^[[:space:]]*(const|let|var|import|export|return|await|throw)[[:space:]]' "$ALLJS" | grep -vE '(;|\{|\(|,|\[|=>|=|\|\||&&|\?|:)[[:space:]]*$' | wc -l | tr -d ' ')
    row "Semicolons"               "with=$semi_y without=$semi_n  -> $([ "$semi_y" -ge "$semi_n" ] && echo 'semicolons used' || echo 'semicolon-free style')"
    tabs=$(grep -cE $'^\t' "$ALLJS")
    two=$(awk '/^ +[^ ]/ { match($0, /^ +/); if (RLENGTH % 4 == 2) t++ } END { print t + 0 }' "$ALLJS")
    total_ind=$(grep -cE '^ +[^ ]' "$ALLJS")
    if [ "$tabs" -gt "$total_ind" ]; then ind="tabs"
    elif [ "$(pct "$two" "$total_ind")" -gt 10 ]; then ind="2 spaces"
    else ind="4 spaces"; fi
    row "Indentation"              "$ind"
    row "Comments: // lines / JSDoc blocks" "$(cnt '^[[:space:]]*//') / $(cnt '/\*\*')"
    row "console.log (debug leftovers)" "$(cnt 'console\.log')"
    row "console.error / warn"     "$(cnt 'console\.(error|warn)')"

    sub "Naming conventions"
    local pas=0 cam=0 keb=0 sna=0 oth=0 n
    while IFS= read -r f; do
        n="${f##*/}"; n="${n%.*}"; n="${n%.test}"; n="${n%.spec}"
        if   printf '%s' "$n" | grep -qE '^[A-Z][A-Za-z0-9]*$';            then pas=$((pas + 1))
        elif printf '%s' "$n" | grep -qE '^[a-z][a-zA-Z0-9]*$';            then cam=$((cam + 1))
        elif printf '%s' "$n" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)+$';       then keb=$((keb + 1))
        elif printf '%s' "$n" | grep -qE '^[a-z0-9]+(_[a-z0-9]+)+$';       then sna=$((sna + 1))
        else oth=$((oth + 1)); fi
    done < "$TMP/js.txt"
    row "File names"               "PascalCase=$pas camelCase/lowercase=$cam kebab-case=$keb snake_case=$sna other=$oth"
    row "Variables: camelCase"     "$(cnt '(const|let|var)[[:space:]]+[a-z]+[A-Z][A-Za-z0-9]*[[:space:]]*=')"
    row "Variables: snake_case"    "$(cnt '(const|let|var)[[:space:]]+[a-z]+_[a-z_0-9]+[[:space:]]*=')"
    row "Constants: UPPER_SNAKE"    "$(cnt '(const|let|var)[[:space:]]+[A-Z][A-Z0-9_]{2,}[[:space:]]*=')"
    row "Handlers: handleXxx / onXxx" "$(cnt '(const|function)[[:space:]]+handle[A-Z]') / $(cnt '(const|function)[[:space:]]+on[A-Z]')"

    sub "Styling approach"
    row "CSS / SCSS files"         "$(wc -l < "$TMP/css.txt" | tr -d ' ')"
    row "Tailwind-style classNames" "$(cnt 'className=.*[ "'"'"'](flex|grid|p-[0-9]|px-[0-9]|py-[0-9]|m-[0-9]|mt-[0-9]|text-(sm|lg|xl|center|[a-z]+-[0-9]+)|bg-[a-z]+-[0-9]+|rounded|w-full|h-full)')"
    row "CSS module imports"       "$(cnt 'import[[:space:]].*\.module\.(css|scss)')"
    row "Plain CSS imports"        "$(cnt "import[[:space:]]+${Q}[^'\"]*\.(css|scss)${Q}")"
    row "Inline style={{ }}"       "$(cnt 'style=\{\{')"
    row "styled-components / emotion" "$(cnt 'styled\.|styled\(|@emotion')"

    sub "Back-end / routing / database patterns"
    row "Express route definitions" "$(cnt '(app|router)\.(get|post|put|patch|delete)[[:space:]]*\(')"
    row "React Router <Route>"     "$(cnt '<Route[[:space:]]')"
    row "SQL strings in code"      "$(cnt '(SELECT[[:space:]].*FROM|INSERT[[:space:]]+INTO|UPDATE[[:space:]]+[A-Za-z_]+[[:space:]]+SET|DELETE[[:space:]]+FROM)')"
    row "Prepared statements (? / \$1)" "$(cnt '(VALUES|WHERE).*(\?|\$[0-9])')"
    row "pool / connection usage"  "$(cnt '(createPool|createConnection|pool\.(query|execute)|db\.(query|execute)|connection\.(query|execute))')"
    row "ORM calls"                "$(cnt '(sequelize|prisma)\.|\.(findAll|findOne|findByPk|create|findMany)\(')"
    row "JWT / bcrypt"             "$(cnt 'jwt\.') / $(cnt 'bcrypt')"
    row "localStorage / sessionStorage" "$(cnt 'localStorage') / $(cnt 'sessionStorage')"
    row "Env variable reads"       "$(cnt '(import\.meta\.env|process\.env)')"

    sub "Folder conventions in use"
    local d
    for d in components pages views hooks context store services api utils helpers lib routes controllers models middleware config layouts assets styles; do
        c=$(grep -cE "/$d/" "$TMP/js.txt"); [ "$c" -gt 0 ] && row "/$d/" "$c file(s)"
    done
}

sec_samples() {
    section "7. REPRESENTATIVE CODE SAMPLES (use as style reference)"
    local roles="UI component|Page / view|Custom hook|State management|API / service layer|Controller|Model / data access|Routing|Middleware" r f found
    local IFS_OLD="$IFS"
    IFS='|'
    for r in $roles; do
        IFS="$IFS_OLD"
        found=""
        while IFS= read -r f; do
            if [ "$(role_of "$f")" = "$r" ] && [ "$(lines_of "$f")" -ge 5 ]; then found="$f"; break; fi
        done < "$TMP/js.txt"
        if [ -n "$found" ]; then
            sub "$r  ->  $found (first 40 lines)"
            head -n 40 "$found" | emit | sed 's/^/    | /'
        fi
        IFS='|'
    done
    IFS="$IFS_OLD"
}

sec_db_api() {
    section "8. DATABASE AND API MAP"
    sub "SQL files"
    if [ -s "$TMP/sql.txt" ]; then sed 's/^/  /' "$TMP/sql.txt"; else echo "  (none)"; fi

    sub "Tables CREATEd in .sql files"
    grep_oh Ei 'CREATE[[:space:]]+TABLE[[:space:]]+(IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+)?[`"]?[A-Za-z_][A-Za-z0-9_]*' "$TMP/sql.txt" \
        | sed -E 's/^.*[[:space:]]+[`"]?//' | sort -u | sed 's/^/  /'

    sub "Tables referenced by SQL inside source code (name -> number of references)"
    { grep_oh E '(FROM|JOIN|INTO|UPDATE|TABLE)[[:space:]]+[`"]?[A-Za-z_][A-Za-z0-9_]*' "$TMP/src.txt"
      grep_oh Ei '(insert[[:space:]]+into|delete[[:space:]]+from)[[:space:]]+[`"]?[A-Za-z_][A-Za-z0-9_]*' "$TMP/src.txt"; } \
        | sed -E 's/^.*[[:space:]]+[`"]?//' | grep -vE '^(SELECT|WHERE|SET|VALUES|TABLE|IF|NOT|EXISTS|the|a|an|this|that|your|my)$' \
        | sort | uniq -c | sort -rn | head -40 | awk '{printf "  %-34s %s\n", $2, $1}'

    sub "EOV core tables: which files reference them in SQL context"
    local t files
    for t in "${KNOWN_TABLES[@]}"; do
        files=$(grep_files Ei "(from|join|into|update|table|references)[[:space:]\`[]*${t}([^A-Za-z0-9_]|\$)" "$TMP/src.txt" | sed 's#^\./##' | head -8 | tr '\n' ' ')
        printf '  %-32s %s\n' "$t" "${files:-(no SQL reference found)}"
    done

    sub "Back-end endpoints (Express style)"
    grep_all E '(app|router|server)\.(get|post|put|patch|delete|all)[[:space:]]*\(' "$TMP/js.txt" | sed -E 's#^\./##; s/^([^:]+:[0-9]+:)[[:space:]]+/\1 /' | cut -c1-170 | sed 's/^/  /'

    sub "Front-end HTTP calls"
    grep_all E '(fetch|axios(\.[a-z]+)?|api\.(get|post|put|patch|delete))[[:space:]]*\(' "$TMP/js.txt" | sed -E 's#^\./##; s/^([^:]+:[0-9]+:)[[:space:]]+/\1 /' | cut -c1-170 | sed 's/^/  /'

    sub "Front-end routes"
    grep_all E '<Route[[:space:]]|path:[[:space:]]*["'"'"']/' "$TMP/js.txt" | sed -E 's#^\./##; s/^([^:]+:[0-9]+:)[[:space:]]+/\1 /' | cut -c1-170 | sed 's/^/  /'
}

sec_graph() {
    section "9. DEPENDENCY GRAPH (your own files)"
    : > "$TMP/edges.tsv"
    local f spec
    while IFS= read -r f; do
        grep -E '(import|require|from)' "$f" 2>/dev/null | grep -oE "${Q}\.{1,2}/[^'\"]*${Q}" | tr -d "\"'" | while IFS= read -r spec; do
            printf '%s\t%s\n' "$f" "$spec"
        done >> "$TMP/edges.tsv"
    done < "$TMP/js.txt"

    sub "Who imports what (relative imports)"
    if [ -s "$TMP/edges.tsv" ]; then
        sort "$TMP/edges.tsv" | awk -F'\t' '$1 != p { print "  " $1; p = $1 } { print "      -> " $2 }'
    else
        echo "  (none)"
    fi

    sub "Most imported modules (reuse hot-spots)"
    awk -F'\t' '
        function nm(p,   n, a, b) { n = split(p, a, "/"); b = a[n]; sub(/\.[A-Za-z0-9]+$/, "", b); if (b == "index" && n > 1) b = a[n-1]; return b }
        $2 ~ /\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|ico|json)$/ { next }
        { c[nm($2)]++ }
        END { for (k in c) printf "%d\t%s\n", c[k], k }' "$TMP/edges.tsv" | sort -rn | head -15 | awk -F'\t' '{printf "  %4d  %s\n", $1, $2}'

    sub "Possibly unused files (never imported by a relative path; heuristic)"
    awk -F'\t' '
        function nm(p,   n, a, b) { n = split(p, a, "/"); b = a[n]; sub(/\.[A-Za-z0-9]+$/, "", b); if (b == "index" && n > 1) b = a[n-1]; return b }
        FILENAME == ARGV[1] { used[nm($2)] = 1; next }
        {
            b = nm($0)
            if ($0 ~ /\.(test|spec)\./ || $0 ~ /(config|setup)\./) next
            if (b ~ /^(main|App|index|server|app|vite|tailwind|postcss|eslint)$/) next
            if (!(b in used)) print "  " $0
        }' "$TMP/edges.tsv" "$TMP/js.txt"
}

sec_inventory() {
    section "10. FILE INVENTORY"
    printf '  %7s %10s  %s\n' "LINES" "BYTES" "PATH"
    sort -t$'\t' -k3 "$TMP/inv.tsv" | awk -F'\t' '{printf "  %7d %10d  %s\n", $1, $2, $3}'
    sub "10 largest files by line count"
    sort -t$'\t' -k1 -rn "$TMP/inv.tsv" | head -10 | awk -F'\t' '{printf "  %7d  %s\n", $1, $3}'
}

sec_todos() {
    section "11. TODO / FIXME / HACK"
    local out
    out=$(grep_all E '(TODO|FIXME|HACK|XXX)([: ]|$)' "$TMP/src.txt" | sed -E 's#^\./##; s/^([^:]+:[0-9]+:)[[:space:]]+/\1 /' | cut -c1-170)
    if [ -n "$out" ]; then printf '%s\n' "$out" | sed 's/^/  /'; else echo "  (none found)"; fi
}

sec_files() {
    section "12. PER-FILE REPORT AND SOURCE CODE"
    echo "  Files are listed alphabetically by path."
    $REDACT && echo "  Secrets such as password/token/api_key assignments are masked as <REDACTED>."
    local f i=0 n
    n=$(wc -l < "$TMP/src.txt" | tr -d ' ')
    while IFS= read -r f; do
        i=$((i + 1)); log "  [$i/$n] $f"
        dump_file "$f"
    done < "$TMP/src.txt"
}

# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
log "Scanning project in $PWD ..."
build_lists
log "Writing $OUTPUT ..."
{
    echo "PROJECT EXPORT  -  $(basename "$PWD")  -  generated by export_project.sh v2"
    echo "Purpose: give an AI assistant or teammate the full picture of this codebase:"
    echo "structure, stack, conventions, database usage, endpoints and every source file."
    sec_overview
    sec_tree
    sec_layers
    sec_packages
    sec_env
    sec_patterns
    sec_samples
    sec_db_api
    sec_graph
    sec_inventory
    sec_todos
    sec_files
    echo
    echo "=============================== END OF EXPORT ==============================="
} > "$OUTPUT"

log ""
log "Done. $(wc -l < "$OUTPUT" | tr -d ' ') lines, $(wc -c < "$OUTPUT" | tr -d ' ') bytes -> $OUTPUT"
