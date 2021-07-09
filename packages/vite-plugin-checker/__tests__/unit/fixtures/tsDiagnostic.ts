export const diagnostic1 = {
  file: {
    // file: <ref *1> SourceFileObject {
    //   pos: 0,
    //   end: 1113,
    //   flags: 0,
    //   modifierFlagsCache: 0,
    //   transformFlags: 579,
    //   parent: undefined,
    //   kind: 298,
    //   statements: [
    //     [NodeObject],
    //     [NodeObject],
    //     [NodeObject],
    //     [NodeObject],
    //     [NodeObject],
    //     pos: 0,
    //     end: 1112,
    //     hasTrailingComma: false,
    //     transformFlags: 579
    //   ],
    //   endOfFileToken: TokenObject {
    //     pos: 1112,
    //     end: 1113,
    //     flags: 0,
    //     modifierFlagsCache: 0,
    //     transformFlags: 0,
    //     parent: [Circular *1],
    //     kind: 1
    //   },
    fileName: '/Users/fi3ework/vite-plugin-checker/playground/react-ts/src/App.tsx',
    text:
      "import React, { useState } from 'react'\n" +
      "import logo from './logo.svg'\n" +
      "import './App.css'\n" +
      '\n' +
      'function App() {\n' +
      '  // Try change <string> to <number> and the overlay will gone.\n' +
      '  const [count, setCount] = useState<string>(1)\n' +
      '  return (\n' +
      '    <div className="App">\n' +
      '      <header className="App-header">\n' +
      '        <img src={logo} className="App-logo" alt="logo" />\n' +
      '        <p>Hello Vite + React!</p>\n' +
      '        <p>\n' +
      '          <button onClick={() => setCount((count) => count + 1)}>count is: {count}</button>\n' +
      '        </p>\n' +
      '        <p>\n' +
      '          Edit <code>App.tsx</code> and save to test HMR updates.\n' +
      '        </p>\n' +
      '        <p>\n' +
      '          <a\n' +
      '            className="App-link"\n' +
      '            href="https://reactjs.org"\n' +
      '            target="_blank"\n' +
      '            rel="noopener noreferrer"\n' +
      '          >\n' +
      '            Learn React\n' +
      '          </a>\n' +
      "          {' | '}\n" +
      '          <a\n' +
      '            className="App-link"\n' +
      '            href="https://vitejs.dev/guide/features.html"\n' +
      '            target="_blank"\n' +
      '            rel="noopener noreferrer"\n' +
      '          >\n' +
      '            Vite Docs\n' +
      '          </a>\n' +
      '        </p>\n' +
      '      </header>\n' +
      '    </div>\n' +
      '  )\n' +
      '}\n' +
      '\n' +
      'export default App\n',
    languageVersion: 99,
    languageVariant: 1,
    scriptKind: 4,
    isDeclarationFile: false,
    hasNoDefaultLib: false,
    // externalModuleIndicator: NodeObject {
    //   pos: 0,
    //   end: 39,
    //   flags: 0,
    //   modifierFlagsCache: 536870912,
    //   transformFlags: 0,
    //   parent: [Circular *1],
    //   kind: 262,
    //   decorators: undefined,
    //   modifiers: undefined,
    //   symbol: undefined,
    //   localSymbol: undefined,
    //   locals: undefined,
    //   nextContainer: undefined,
    //   importClause: [NodeObject],
    //   moduleSpecifier: [TokenObject]
    // },
    bindDiagnostics: [],
    bindSuggestionDiagnostics: undefined,
    // pragmas: Map(0) {},
    checkJsDirective: undefined,
    referencedFiles: [],
    typeReferenceDirectives: [],
    libReferenceDirectives: [],
    amdDependencies: [],
    commentDirectives: undefined,
    nodeCount: 177,
    identifierCount: 48,
    // identifiers: Map(23) {
    //   'React' => 'React',
    //   'useState' => 'useState',
    //   'react' => 'react',
    //   'logo' => 'logo',
    //   './logo.svg' => './logo.svg',
    //   './App.css' => './App.css',
    //   'App' => 'App',
    //   'count' => 'count',
    //   'setCount' => 'setCount',
    //   'div' => 'div',
    //   'className' => 'className',
    //   'header' => 'header',
    //   'img' => 'img',
    //   'src' => 'src',
    //   'alt' => 'alt',
    //   'p' => 'p',
    //   'button' => 'button',
    //   'onClick' => 'onClick',
    //   'code' => 'code',
    //   'a' => 'a',
    //   'href' => 'href',
    //   'target' => 'target',
    //   'rel' => 'rel'
    // },
    parseDiagnostics: [],
    version: 'e38e5afa683ca0a1613c6d335a73db12ae58b69c4555ac645ccc8f6a15dce3d6',
    path: '/users/fi3ework/vite-plugin-checker/playground/react-ts/src/app.tsx',
    resolvedPath: '/users/fi3ework/vite-plugin-checker/playground/react-ts/src/app.tsx',
    originalFileName: '/Users/fi3ework/vite-plugin-checker/playground/react-ts/src/App.tsx',
    // imports: [ [TokenObject], [TokenObject], [TokenObject] ],
    moduleAugmentations: [],
    ambientModuleNames: [],
    // resolvedModules: Map(3) {
    //   'react' => [Object],
    //   './logo.svg' => undefined,
    //   './App.css' => undefined
    // },
    // symbol: SymbolObject {
    //   flags: 512,
    //   escapedName: '"/Users/fi3ework/vite-plugin-checker/playground/react-ts/src/App"',
    //   declarations: [Array],
    //   exports: [Map],
    //   valueDeclaration: [Circular *1],
    //   id: 7114
    // },
    // locals: Map(4) {
    //   'App' => [SymbolObject],
    //   'React' => [SymbolObject],
    //   'useState' => [SymbolObject],
    //   'logo' => [SymbolObject]
    // },
    // nextContainer: NodeObject {
    //   pos: 88,
    //   end: 1092,
    //   flags: 0,
    //   modifierFlagsCache: 536870912,
    //   transformFlags: 2228803,
    //   parent: [Circular *1],
    //   kind: 252,
    //   decorators: undefined,
    //   modifiers: undefined,
    //   symbol: [SymbolObject],
    //   localSymbol: undefined,
    //   locals: [Map],
    //   nextContainer: [NodeObject],
    //   name: [IdentifierObject],
    //   typeParameters: undefined,
    //   parameters: [Array],
    //   type: undefined,
    //   body: [NodeObject],
    //   asteriskToken: undefined,
    //   id: 14743
    // },
    endFlowNode: { flags: 2 },
    symbolCount: 36,
    // classifiableNames: Set(4) { 'React', 'useState', 'logo', 'default' },
    id: 14728,
    lineMap: [
      0, 40, 70, 89, 90, 107, 171, 219, 230, 256, 294, 353, 388, 400, 492, 505, 517, 583, 596, 608,
      621, 654, 693, 721, 759, 771, 795, 810, 828, 841, 874, 932, 960, 998, 1010, 1032, 1047, 1060,
      1076, 1087, 1091, 1093, 1094, 1113,
    ],
  },
  start: 216,
  length: 1,
  code: 2345,
  category: 1,
  messageText:
    "Argument of type 'number' is not assignable to parameter of type 'string | (() => string)'.",
  relatedInformation: undefined,
}
