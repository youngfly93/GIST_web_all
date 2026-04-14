#!/usr/bin/env python3

from pprint import pprint

from dbgist_v1_client import DbGistApiError, DbGistClient


def main() -> None:
    client = DbGistClient("http://127.0.0.1:8000")

    pprint(client.health())
    pprint(client.modules())

    try:
        pprint(client.transcriptomics_summary("KIT"))
        pprint(client.noncoding_summary("hsa-miR-21-5p"))
    except DbGistApiError as exc:
        print(exc)
        if exc.payload:
            pprint(exc.payload)


if __name__ == "__main__":
    main()
