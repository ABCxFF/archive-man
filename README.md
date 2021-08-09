# archive-man
Bot that archives discord servers

## Usage

In conf.json, have properties:
  1. `token` (bot's token)
  2. `prefix` (command prefix)
  3. `owner` or `owners` (user id or array of user ids, accordingally)

## In Discord 

**Command:** `archive` (so with prefix `^`, it'd be `^archive`)

**Channel Args:** Either `all` or a list of channel references (`#general` aka `<#channel id>`)

**Option Args:**  
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

## Examples

**All with prefix=`^`**

The following archives the entire server, ignoring #logs channel whos id is `12398093921`, and storing members
```
^archive all --ignore=12398093921 --archive-members
```
<br>

The following archives #general, uploading the .txt to discord, and not storing it to the file system
```
^archive #general --upload --no-store
```
<br>

The following archives #general and #media, uploading the .txt to discord, and storing to the file system
```
^archive #general #media --upload
```

## License

The MIT License (MIT)
Copyright © 2021 ABCxFF

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
