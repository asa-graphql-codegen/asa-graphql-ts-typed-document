# asa-graphql-ts-typed-document

[![CI](https://github.com/asa-graphql-codegen/asa-graphql-ts-typed-document/actions/workflows/ci.yml/badge.svg)](https://github.com/asa-graphql-codegen/asa-graphql-ts-typed-document/actions/workflows/ci.yml)

POC graphql-code-generator plugin for typed documents

This repo was forked from: https://github.com/dotansimha/graphql-code-generator/tree/master/packages/plugins/typescript/typed-document-node
From commit `295382a150b73b58ccba754d03f2d1cfa11fae1c`

The point of this fork is to add the ability to specify a `fragmentImportsSourceMap` config object, which provides a map of fragment name to filepath, thereby informing where to import types for each external fragment. For example:

```
{
  fragmentImportsSourceMap: {
    UserFragment: './fragments/_user-fragment.graphql'
  }
}
```

See the tests for behavior:
https://github.com/asa-graphql-codegen/asa-graphql-ts-typed-document/blob/069cac5881fafa7f043d4e9a558344e887ac49ee/tests/typed-document-node.spec.ts#L149