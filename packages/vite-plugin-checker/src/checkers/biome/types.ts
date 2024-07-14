export interface BiomeOutput {
  diagnostics: Diagnostic[]
}

/**
 * The following code are copied from https://www.npmjs.com/package/@biomejs/wasm-nodejs/v/1.8.3?activeTab=code
 */

type DiagnosticTag =
  | 'fixable'
  | 'internal'
  | 'unnecessaryCode'
  | 'deprecatedCode'
  | 'verbose'
type DiagnosticTags = DiagnosticTag[]
// NOTE: only use { file: string } for now
// type Resource_for_String = 'argv' | 'memory' | { file: string }
type Resource_for_String = { file: string }
type TextSize = number
type TextRange = [TextSize, TextSize]
type MarkupBuf = MarkupNodeBuf[]

interface MarkupNodeBuf {
  content: string
  elements: MarkupElement[]
}

type MarkupElement =
  | 'Emphasis'
  | 'Dim'
  | 'Italic'
  | 'Underline'
  | 'Error'
  | 'Success'
  | 'Warn'
  | 'Info'
  | 'Debug'
  | 'Trace'
  | 'Inverse'
  | { Hyperlink: { href: string } }

type Category =
  | 'lint/a11y/noAccessKey'
  | 'lint/a11y/noAriaHiddenOnFocusable'
  | 'lint/a11y/noAriaUnsupportedElements'
  | 'lint/a11y/noAutofocus'
  | 'lint/a11y/noBlankTarget'
  | 'lint/a11y/noDistractingElements'
  | 'lint/a11y/noHeaderScope'
  | 'lint/a11y/noInteractiveElementToNoninteractiveRole'
  | 'lint/a11y/noNoninteractiveElementToInteractiveRole'
  | 'lint/a11y/noNoninteractiveTabindex'
  | 'lint/a11y/noPositiveTabindex'
  | 'lint/a11y/noRedundantAlt'
  | 'lint/a11y/noRedundantRoles'
  | 'lint/a11y/noSvgWithoutTitle'
  | 'lint/a11y/useAltText'
  | 'lint/a11y/useAnchorContent'
  | 'lint/a11y/useAriaActivedescendantWithTabindex'
  | 'lint/a11y/useAriaPropsForRole'
  | 'lint/a11y/useButtonType'
  | 'lint/a11y/useHeadingContent'
  | 'lint/a11y/useHtmlLang'
  | 'lint/a11y/useIframeTitle'
  | 'lint/a11y/useKeyWithClickEvents'
  | 'lint/a11y/useKeyWithMouseEvents'
  | 'lint/a11y/useMediaCaption'
  | 'lint/a11y/useValidAnchor'
  | 'lint/a11y/useValidAriaProps'
  | 'lint/a11y/useValidAriaRole'
  | 'lint/a11y/useValidAriaValues'
  | 'lint/a11y/useValidLang'
  | 'lint/complexity/noBannedTypes'
  | 'lint/complexity/noEmptyTypeParameters'
  | 'lint/complexity/noExcessiveCognitiveComplexity'
  | 'lint/complexity/noExcessiveNestedTestSuites'
  | 'lint/complexity/noExtraBooleanCast'
  | 'lint/complexity/noForEach'
  | 'lint/complexity/noMultipleSpacesInRegularExpressionLiterals'
  | 'lint/complexity/noStaticOnlyClass'
  | 'lint/complexity/noThisInStatic'
  | 'lint/complexity/noUselessCatch'
  | 'lint/complexity/noUselessConstructor'
  | 'lint/complexity/noUselessEmptyExport'
  | 'lint/complexity/noUselessFragments'
  | 'lint/complexity/noUselessLabel'
  | 'lint/complexity/noUselessLoneBlockStatements'
  | 'lint/complexity/noUselessRename'
  | 'lint/complexity/noUselessSwitchCase'
  | 'lint/complexity/noUselessTernary'
  | 'lint/complexity/noUselessThisAlias'
  | 'lint/complexity/noUselessTypeConstraint'
  | 'lint/complexity/noVoid'
  | 'lint/complexity/noWith'
  | 'lint/complexity/useArrowFunction'
  | 'lint/complexity/useFlatMap'
  | 'lint/complexity/useLiteralKeys'
  | 'lint/complexity/useOptionalChain'
  | 'lint/complexity/useRegexLiterals'
  | 'lint/complexity/useSimpleNumberKeys'
  | 'lint/complexity/useSimplifiedLogicExpression'
  | 'lint/correctness/noChildrenProp'
  | 'lint/correctness/noConstAssign'
  | 'lint/correctness/noConstantCondition'
  | 'lint/correctness/noConstantMathMinMaxClamp'
  | 'lint/correctness/noConstructorReturn'
  | 'lint/correctness/noEmptyCharacterClassInRegex'
  | 'lint/correctness/noEmptyPattern'
  | 'lint/correctness/noFlatMapIdentity'
  | 'lint/correctness/noGlobalObjectCalls'
  | 'lint/correctness/noInnerDeclarations'
  | 'lint/correctness/noInvalidConstructorSuper'
  | 'lint/correctness/noInvalidNewBuiltin'
  | 'lint/correctness/noInvalidUseBeforeDeclaration'
  | 'lint/correctness/noNewSymbol'
  | 'lint/correctness/noNodejsModules'
  | 'lint/correctness/noNonoctalDecimalEscape'
  | 'lint/correctness/noPrecisionLoss'
  | 'lint/correctness/noRenderReturnValue'
  | 'lint/correctness/noSelfAssign'
  | 'lint/correctness/noSetterReturn'
  | 'lint/correctness/noStringCaseMismatch'
  | 'lint/correctness/noSwitchDeclarations'
  | 'lint/correctness/noUndeclaredVariables'
  | 'lint/correctness/noUnnecessaryContinue'
  | 'lint/correctness/noUnreachable'
  | 'lint/correctness/noUnreachableSuper'
  | 'lint/correctness/noUnsafeFinally'
  | 'lint/correctness/noUnsafeOptionalChaining'
  | 'lint/correctness/noUnusedImports'
  | 'lint/correctness/noUnusedLabels'
  | 'lint/correctness/noUnusedPrivateClassMembers'
  | 'lint/correctness/noUnusedVariables'
  | 'lint/correctness/noVoidElementsWithChildren'
  | 'lint/correctness/noVoidTypeReturn'
  | 'lint/correctness/useArrayLiterals'
  | 'lint/correctness/useExhaustiveDependencies'
  | 'lint/correctness/useHookAtTopLevel'
  | 'lint/correctness/useIsNan'
  | 'lint/correctness/useJsxKeyInIterable'
  | 'lint/correctness/useValidForDirection'
  | 'lint/correctness/useYield'
  | 'lint/nursery/colorNoInvalidHex'
  | 'lint/nursery/noColorInvalidHex'
  | 'lint/nursery/noConsole'
  | 'lint/nursery/noDoneCallback'
  | 'lint/nursery/noDuplicateAtImportRules'
  | 'lint/nursery/noDuplicateElseIf'
  | 'lint/nursery/noDuplicateFontNames'
  | 'lint/nursery/noDuplicateJsonKeys'
  | 'lint/nursery/noDuplicateSelectorsKeyframeBlock'
  | 'lint/nursery/noEmptyBlock'
  | 'lint/nursery/noEvolvingTypes'
  | 'lint/nursery/noExportedImports'
  | 'lint/nursery/noImportantInKeyframe'
  | 'lint/nursery/noInvalidDirectionInLinearGradient'
  | 'lint/nursery/noInvalidPositionAtImportRule'
  | 'lint/nursery/noLabelWithoutControl'
  | 'lint/nursery/noMisplacedAssertion'
  | 'lint/nursery/noMissingGenericFamilyKeyword'
  | 'lint/nursery/noReactSpecificProps'
  | 'lint/nursery/noRestrictedImports'
  | 'lint/nursery/noShorthandPropertyOverrides'
  | 'lint/nursery/noSubstr'
  | 'lint/nursery/noTypeOnlyImportAttributes'
  | 'lint/nursery/noUndeclaredDependencies'
  | 'lint/nursery/noUnknownFunction'
  | 'lint/nursery/noUnknownMediaFeatureName'
  | 'lint/nursery/noUnknownProperty'
  | 'lint/nursery/noUnknownPseudoClassSelector'
  | 'lint/nursery/noUnknownSelectorPseudoElement'
  | 'lint/nursery/noUnknownUnit'
  | 'lint/nursery/noUnmatchableAnbSelector'
  | 'lint/nursery/noUnusedFunctionParameters'
  | 'lint/nursery/noUselessStringConcat'
  | 'lint/nursery/noUselessUndefinedInitialization'
  | 'lint/nursery/noYodaExpression'
  | 'lint/nursery/useAdjacentOverloadSignatures'
  | 'lint/nursery/useBiomeSuppressionComment'
  | 'lint/nursery/useConsistentBuiltinInstantiation'
  | 'lint/nursery/useConsistentGridAreas'
  | 'lint/nursery/useDateNow'
  | 'lint/nursery/useDefaultSwitchClause'
  | 'lint/nursery/useDeprecatedReason'
  | 'lint/nursery/useErrorMessage'
  | 'lint/nursery/useExplicitLengthCheck'
  | 'lint/nursery/useFocusableInteractive'
  | 'lint/nursery/useGenericFontNames'
  | 'lint/nursery/useImportExtensions'
  | 'lint/nursery/useImportRestrictions'
  | 'lint/nursery/useNumberToFixedDigitsArgument'
  | 'lint/nursery/useSemanticElements'
  | 'lint/nursery/useSortedClasses'
  | 'lint/nursery/useThrowNewError'
  | 'lint/nursery/useThrowOnlyError'
  | 'lint/nursery/useTopLevelRegex'
  | 'lint/nursery/useValidAutocomplete'
  | 'lint/performance/noAccumulatingSpread'
  | 'lint/performance/noBarrelFile'
  | 'lint/performance/noDelete'
  | 'lint/performance/noReExportAll'
  | 'lint/security/noDangerouslySetInnerHtml'
  | 'lint/security/noDangerouslySetInnerHtmlWithChildren'
  | 'lint/security/noGlobalEval'
  | 'lint/style/noArguments'
  | 'lint/style/noCommaOperator'
  | 'lint/style/noDefaultExport'
  | 'lint/style/noImplicitBoolean'
  | 'lint/style/noInferrableTypes'
  | 'lint/style/noNamespace'
  | 'lint/style/noNamespaceImport'
  | 'lint/style/noNegationElse'
  | 'lint/style/noNonNullAssertion'
  | 'lint/style/noParameterAssign'
  | 'lint/style/noParameterProperties'
  | 'lint/style/noRestrictedGlobals'
  | 'lint/style/noShoutyConstants'
  | 'lint/style/noUnusedTemplateLiteral'
  | 'lint/style/noUselessElse'
  | 'lint/style/noVar'
  | 'lint/style/useAsConstAssertion'
  | 'lint/style/useBlockStatements'
  | 'lint/style/useCollapsedElseIf'
  | 'lint/style/useConsistentArrayType'
  | 'lint/style/useConst'
  | 'lint/style/useDefaultParameterLast'
  | 'lint/style/useEnumInitializers'
  | 'lint/style/useExponentiationOperator'
  | 'lint/style/useExportType'
  | 'lint/style/useFilenamingConvention'
  | 'lint/style/useForOf'
  | 'lint/style/useFragmentSyntax'
  | 'lint/style/useImportType'
  | 'lint/style/useLiteralEnumMembers'
  | 'lint/style/useNamingConvention'
  | 'lint/style/useNodeAssertStrict'
  | 'lint/style/useNodejsImportProtocol'
  | 'lint/style/useNumberNamespace'
  | 'lint/style/useNumericLiterals'
  | 'lint/style/useSelfClosingElements'
  | 'lint/style/useShorthandArrayType'
  | 'lint/style/useShorthandAssign'
  | 'lint/style/useShorthandFunctionType'
  | 'lint/style/useSingleCaseStatement'
  | 'lint/style/useSingleVarDeclarator'
  | 'lint/style/useTemplate'
  | 'lint/style/useWhile'
  | 'lint/suspicious/noApproximativeNumericConstant'
  | 'lint/suspicious/noArrayIndexKey'
  | 'lint/suspicious/noAssignInExpressions'
  | 'lint/suspicious/noAsyncPromiseExecutor'
  | 'lint/suspicious/noCatchAssign'
  | 'lint/suspicious/noClassAssign'
  | 'lint/suspicious/noCommentText'
  | 'lint/suspicious/noCompareNegZero'
  | 'lint/suspicious/noConfusingLabels'
  | 'lint/suspicious/noConfusingVoidType'
  | 'lint/suspicious/noConsoleLog'
  | 'lint/suspicious/noConstEnum'
  | 'lint/suspicious/noControlCharactersInRegex'
  | 'lint/suspicious/noDebugger'
  | 'lint/suspicious/noDoubleEquals'
  | 'lint/suspicious/noDuplicateCase'
  | 'lint/suspicious/noDuplicateClassMembers'
  | 'lint/suspicious/noDuplicateJsxProps'
  | 'lint/suspicious/noDuplicateObjectKeys'
  | 'lint/suspicious/noDuplicateParameters'
  | 'lint/suspicious/noDuplicateTestHooks'
  | 'lint/suspicious/noEmptyBlockStatements'
  | 'lint/suspicious/noEmptyInterface'
  | 'lint/suspicious/noExplicitAny'
  | 'lint/suspicious/noExportsInTest'
  | 'lint/suspicious/noExtraNonNullAssertion'
  | 'lint/suspicious/noFallthroughSwitchClause'
  | 'lint/suspicious/noFocusedTests'
  | 'lint/suspicious/noFunctionAssign'
  | 'lint/suspicious/noGlobalAssign'
  | 'lint/suspicious/noGlobalIsFinite'
  | 'lint/suspicious/noGlobalIsNan'
  | 'lint/suspicious/noImplicitAnyLet'
  | 'lint/suspicious/noImportAssign'
  | 'lint/suspicious/noLabelVar'
  | 'lint/suspicious/noMisleadingCharacterClass'
  | 'lint/suspicious/noMisleadingInstantiator'
  | 'lint/suspicious/noMisrefactoredShorthandAssign'
  | 'lint/suspicious/noPrototypeBuiltins'
  | 'lint/suspicious/noRedeclare'
  | 'lint/suspicious/noRedundantUseStrict'
  | 'lint/suspicious/noSelfCompare'
  | 'lint/suspicious/noShadowRestrictedNames'
  | 'lint/suspicious/noSkippedTests'
  | 'lint/suspicious/noSparseArray'
  | 'lint/suspicious/noSuspiciousSemicolonInJsx'
  | 'lint/suspicious/noThenProperty'
  | 'lint/suspicious/noUnsafeDeclarationMerging'
  | 'lint/suspicious/noUnsafeNegation'
  | 'lint/suspicious/useAwait'
  | 'lint/suspicious/useDefaultSwitchClauseLast'
  | 'lint/suspicious/useGetterReturn'
  | 'lint/suspicious/useIsArray'
  | 'lint/suspicious/useNamespaceKeyword'
  | 'lint/suspicious/useValidTypeof'
  | 'assists/nursery/useSortedKeys'
  | 'files/missingHandler'
  | 'format'
  | 'check'
  | 'ci'
  | 'configuration'
  | 'organizeImports'
  | 'migrate'
  | 'deserialize'
  | 'project'
  | 'search'
  | 'internalError/io'
  | 'internalError/fs'
  | 'internalError/panic'
  | 'parse'
  | 'parse/noSuperWithoutExtends'
  | 'parse/noInitializerWithDefinite'
  | 'parse/noDuplicatePrivateClassMembers'
  | 'lint'
  | 'lint/a11y'
  | 'lint/complexity'
  | 'lint/correctness'
  | 'lint/nursery'
  | 'lint/performance'
  | 'lint/security'
  | 'lint/style'
  | 'lint/suspicious'
  | 'suppressions/parse'
  | 'suppressions/unknownGroup'
  | 'suppressions/unknownRule'
  | 'suppressions/unused'
  | 'suppressions/deprecatedSuppressionComment'
  | 'args/fileNotFound'
  | 'flags/invalid'
  | 'semanticTests'

interface Location {
  path?: Resource_for_String
  sourceCode?: string
  span?: TextRange
}

export interface Diagnostic {
  advices: Advices
  category?: Category
  description: string
  location: Location
  message: MarkupBuf
  severity: Severity
  source?: Diagnostic
  tags: DiagnosticTags
  verboseAdvices: Advices
}

interface Advices {
  advices: Advice[]
}

type Severity = 'hint' | 'information' | 'warning' | 'error' | 'fatal'
type Advice =
  | { log: [LogCategory, MarkupBuf] }
  | { list: MarkupBuf[] }
  | { frame: Location }
  | { diff: TextEdit }
  | { backtrace: [MarkupBuf, Backtrace] }
  | { command: string }
  | { group: [MarkupBuf, Advices] }

type LogCategory = 'none' | 'info' | 'warn' | 'error'
interface TextEdit {
  dictionary: string
  ops: CompressedOp[]
}
type Backtrace = BacktraceFrame[]
type CompressedOp = { diffOp: DiffOp } | { equalLines: { line_count: number } }

type DiffOp =
  | { equal: { range: TextRange } }
  | { insert: { range: TextRange } }
  | { delete: { range: TextRange } }

interface BacktraceFrame {
  ip: number
  symbols: BacktraceSymbol[]
}

interface BacktraceSymbol {
  colno?: number
  filename?: string
  lineno?: number
  name?: string
}
