# archive-man
Bot that archives discord servers

## Usage

In conf.json, have properties:
  1. `token` (bot's token)
  2. `prefix` (command prefix)
  3. `owner` or `owners` (user id or array of user ids, accordingally)

## In Discord 

**Command: `archive`** (so with prefix `^`, it'd be `^archive`)

Channels: Either `all` or a list of channel references (`#general` aka `<#channel id>`)

Options:  
`--upload`: Uploads files to discord  
`--ignore={id}`: Ignore a specific channel by id (for example, `--ignore=128391273881923`)  
`--no-store`: Do not store files locally  
`--archive-members`: Archive members into `_members.txt`  
`--no-threads`: Ignore all thread channels  
`--chunk-delay={num}`: Defaults to 500, the delay between message fetches  

## Output

All archives are stored in `downloads/{guild id}/`.  
In the guild's directory:  
 - channels are stored as `{channel name}.txt`
 - threads are stored as `{thread name}.thread.txt`
 - attachments are stored as `attachments/{attachment index}.{attachment name}.{attachment extension}`
 - guild members are stored in `_members.txt`

In the message archives (.txt), attachments are referenced as `<{attachment id} {local attachment stored path}>`, where you can access the attachment by following the path relative to the guild's directory


