import { pascalCase } from "change-case-all";
import { Types } from "@graphql-codegen/plugin-helpers";
import {
  LoadedFragment,
  ClientSideBaseVisitor,
  ClientSideBasePluginConfig,
  DocumentMode,
  RawClientSideBasePluginConfig,
} from "@graphql-codegen/visitor-plugin-common";
import {
  DefinitionNode,
  FragmentDefinitionNode,
  GraphQLSchema,
  OperationDefinitionNode,
} from "graphql";

export interface TypeScriptDocumentNodesVisitorPluginConfig
  extends RawClientSideBasePluginConfig {
  documentTypeImportDirective?: string;
  fragmentImportsSourceMap?: Record<string, string>;
}

// TODO This probably gonna be a perf bottleneck. Probably need to somehow ensure source file location is available
// natively in the visitor for the OperationDefinition method. Current code is OK for now as it's only called
// when an error is thrown for anonymous queries.
function generateOperationToSourceMap(
  documents: Types.DocumentFile[]
): Map<DefinitionNode, string> {
  const map = new Map<DefinitionNode, string>();
  documents.forEach((doc) => {
    const location = doc.location;
    if (location && doc.document && doc.document) {
      doc.document.definitions.forEach((def) => {
        map.set(def, location);
      });
    }
  });

  return map;
}

function isFragmentDefinition(
  doc: DefinitionNode
): doc is FragmentDefinitionNode {
  return doc.kind === "FragmentDefinition";
}

export class TypeScriptDocumentNodesVisitor extends ClientSideBaseVisitor<
  TypeScriptDocumentNodesVisitorPluginConfig,
  ClientSideBasePluginConfig
> {
  constructor(
    schema: GraphQLSchema,
    fragments: LoadedFragment[],
    config: TypeScriptDocumentNodesVisitorPluginConfig,
    documents: Types.DocumentFile[]
  ) {
    super(
      schema,
      fragments,
      {
        documentMode: DocumentMode.documentNodeImportFragments,
        documentNodeImport:
          config.documentTypeImportDirective ||
          "@graphql-typed-document-node/core#TypedDocumentNode",
        ...config,
      },
      {},
      documents
    );
  }

  // Only return locally defined fragments. Ignore imported fragments.
  _extractFragments(
    document: FragmentDefinitionNode | OperationDefinitionNode,
    withNested?: boolean
  ) {
    const fragments = super._extractFragments(document, withNested);
    const localFragments = this._documents
      .map((r) => {
        return r.document.definitions
          .filter(isFragmentDefinition)
          .map(({ name }) => name.value);
      })
      .flat();
    return fragments.filter((fragmentName) =>
      localFragments.includes(fragmentName)
    );
  }

  private getOperationLocation(
    node: OperationDefinitionNode
  ): string | undefined {
    const docSourceMap = generateOperationToSourceMap(this._documents);
    return docSourceMap.get(node);
  }

  protected _generateFragment(fragmentDocument: FragmentDefinitionNode) {
    return `export const ${fragmentDocument.name.value}: ${this.getFragmentName(
      fragmentDocument
    )};`;
  }

  public OperationDefinition(node: OperationDefinitionNode): string {
    const documentVariableName = this.getOperationVariableName(node);
    const isAnonymousQuery = !node.name;

    if (isAnonymousQuery) {
      // Codgen doesn't currently support public assess to the name of operations variables
      // https://github.com/dotansimha/graphql-code-generator/blob/368a45ed2c324d3ffc648cb805b1252df851e0ce/packages/plugins/other/visitor-plugin-common/src/base-documents-visitor.ts#L188
      throw new Error(
        "Anonymous queries not supported: " + this.getOperationLocation(node)
      );
    }

    const operationType = pascalCase(node.operation);
    const operationTypeSuffix = this.getOperationSuffix(node, operationType);
    const operationVariablesTypes = this.convertName(node, {
      suffix: operationTypeSuffix + "Variables",
    });
    const operationResultType = this.convertName(node, {
      suffix: operationTypeSuffix + this._parsedConfig.operationResultSuffix,
    });

    const typeDef = `export type ${documentVariableName} = ${getDocumentType(
      operationResultType,
      node.variableDefinitions.length && operationVariablesTypes
    )};`;
    // TODO: do we allow multiple queries per file?
    const moduleDeclaration = generateModuleDeclaration(documentVariableName);
    return typeDef + "\n" + moduleDeclaration;
  }
}

interface QueryTypes {
  resultType: string;
  variablesType: string;
}

function getDocumentType(
  operationResultType: string,
  operationVariablesTypes?: string
) {
  if (operationVariablesTypes) {
    return `DocumentNode<${operationResultType}, ${operationVariablesTypes}>`;
  }
  return `DocumentNode<${operationResultType}>`;
}

function generateModuleDeclaration(
  typeVariableName: string,
  localTypeNames?: QueryTypes
) {
  return `
  declare const query: ${typeVariableName};
  export default query;
    `;
}
