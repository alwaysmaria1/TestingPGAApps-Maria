                                                                   
# Usage: ./test-commit.sh <source‑file> [commit‑message]                           
                                                                                   
set -euo pipefail                                                                  
                                                                                   
# ─────────────────────────── arguments ──────────────────────────────             
SRC_FILE=${1:-}                                                                    
COMMIT_MSG=${2:-"chore(test): add random copy for pipeline test"}                  
                                                                                   
if [[ -z "$SRC_FILE" ]]; then                                                      
  echo "❌  You must pass the path of the file to copy" >&2                        
  echo "    Usage: $0 <source-file> [commit-message]" >&2                          
  exit 1                                                                           
fi                                                                                 
                                                                                   
if [[ ! -f "$SRC_FILE" ]]; then                                                    
  echo "❌  Source file not found: $SRC_FILE" >&2                                  
  exit 1                                                                           
fi                                                                                 
                                                                                   
# ────────────────────────── random filename ─────────────────────────             
DIR=$(dirname "$SRC_FILE")                                                         
BASE=$(basename "$SRC_FILE")                                                       
EXT="${BASE##*.}"           # file extension                                       
NAME="${BASE%.*}"           # filename without extension                           
                                                                                   
RAND=$(openssl rand -hex 4) # 8‑char random string                                 
NEW_FILE="${DIR}/${NAME}_${RAND}.${EXT}"                                           
                                                                                   
# ─────────────────────────── duplicate & git ────────────────────────             
cp "$SRC_FILE" "$NEW_FILE"                                                         
echo "🆕  Copied -> $NEW_FILE"                                                     
                                                                                   
git add "$NEW_FILE"                                                                
git commit -m "$COMMIT_MSG"                                                        
git push                                                                           
                                                                                   
echo "✅  Pushed commit with random file: $NEW_FILE"    