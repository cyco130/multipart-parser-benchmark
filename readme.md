This is a simple benchmark for multipart form data parsers for web streams.

- Install dependencies with `pnpm install`
- Start the server with `pnpm start`
- Run `time curl -F "file=@/path/to/some/test/file" localhost:3000/{parser}` where `{parser}` is the name of the parser.
- Run `cmp /path/to/some/test/file {parser}.bin` to verify that the file was received correctly.

## Results

On my computer (1th Gen Intel© Core™ i7-1165G7 @ 2.80GHz × 4, Node 18.14.2 on Linux Mint 21.1 Cinnamon), using a ~800MB test file, I get the following results:

| Parser name | Package                          |        Time |
| ----------- | -------------------------------- | ----------: |
| `web3`      | `@web3-storage/multipart-parser` | `0m14,799s` |
| `hattip`    | `@hattip/multipart`              |  `0m1,672s` |
| `busboy`    | `busboy`                         |  `0m0,701s` |

According to this [`@hattip/multipart`](https://github.com/hattipjs/hattip/tree/main/packages/base/multipart) is about 9x faster than [`@web3-storage/multipart-parser`](https://github.com/web3-storage/multipart-parser) for large files.

[Busboy](https://github.com/mscdex/busboy) (which uses Node streams, not web streams), is included for reference and is more than twice as fast as `@hattip/multipart`. I believe switching to **a proper implementation** of Boyer-Moore-Horspool from simple linear search could close the gap substantially.

## TODO

- Add more parsers
- Test with lots of small files
