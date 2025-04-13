import type * as babel from '@babel/core';
import type { PluginItem } from '@babel/core';
import type { PluginObj } from '@babel/core';
import { store } from './shared/store';

export function findDisplayNamePropertyInClassExpression(
  path: babel.NodePath<babel.types.Node>,
  t: typeof babel.types,
  componentName: string,
): string | null {
  if (!t.isClassDeclaration(path.node) && !t.isClassExpression(path.node))
    return null;

  path.traverse({
    ClassProperty(propertyPath: babel.NodePath<babel.types.ClassProperty>) {
      // e.g. class App extends React.Component {
      //        static displayName = 'App_mcp'
      //      }
      if (
        t.isIdentifier(propertyPath.node.key, { name: 'displayName' }) &&
        propertyPath.node.static
      ) {
        if (t.isStringLiteral(propertyPath.node.value)) {
          return propertyPath.node.value.value;
        }
        if (t.isIdentifier(propertyPath.node.value)) {
          const value = findConstantIdentifierValueInScope(
            propertyPath,
            t,
            propertyPath.node.value,
          );
          if (value) return value;
          return componentName;
        }
      }
    },
  });

  return null;
}

/**
 * Handles the cases of App.displayName = 'App' or App.displayName = NAME_CONSTANT
 */
export function findDisplayNameAssignmentInScope(
  path: babel.NodePath<babel.types.Node>,
  t: typeof babel.types,
  componentName: string,
): string | null {
  // Get the binding for the component
  const binding = path.scope.getBinding(componentName);

  // If we can't find the binding, assume no displayName exists
  if (!binding) return null;

  // Check all references to this component
  for (const refPath of binding.referencePaths) {
    // Check if it's componentName.displayName = ?
    const parent = refPath.parent;
    if (!t.isMemberExpression(parent)) continue;
    if (!t.isIdentifier(parent.property, { name: 'displayName' })) continue;

    // Check if it's used in an assignment
    const memberPath = refPath.parentPath;
    const grandParent = memberPath.parent;

    if (t.isAssignmentExpression(grandParent) && grandParent.operator === '=') {
      // Found an assignment, now extract the value
      const valueNode = grandParent.right;
      const grandParentPath = memberPath.parentPath;
      // simple case like App.displayName = 'App'
      if (t.isStringLiteral(valueNode)) return valueNode.value;
      
      if (t.isIdentifier(valueNode)) {
        // it also can be App.displayName = NAME_CONSTANT
        const value = findConstantIdentifierValueInScope(
          grandParentPath,
          t,
          valueNode,
        );
        if (value) return value;
        return componentName;
      }
    }
  }
  return null;
}

/**
 * Find the value of the constant identifier in the scope
 */
function findConstantIdentifierValueInScope(
  path: babel.NodePath<babel.types.Node>,
  t: typeof babel.types,
  valueNode: babel.types.Node,
): string | null {
  if (!t.isIdentifier(valueNode)) return null;
  // it also can be App.displayName = NAME_CONSTANT
  // so we try to find the NAME_CONSTANT in the scope
  // if not found just return null;
  const valueBind = path.scope.getBinding(valueNode.name);
  if (
    valueBind?.constant &&
    valueBind.path.isVariableDeclarator()
  ) {
    const init = valueBind.path.node.init;
    if (t.isStringLiteral(init)) {
      return init.value;
    }
  }
  return null;
}

/**
 * Check if a path represents a React class component
 */
function isReactClassComponent(
  node: babel.types.ClassExpression | babel.types.ClassDeclaration,
  t: typeof babel.types,
) {
  // Check if class extends React.Component, Component, PureComponent, or React.PureComponent
  const superClass = node.superClass;
  if (!superClass) return false;

  return (
    (t.isMemberExpression(superClass) &&
      t.isIdentifier(superClass.object, { name: 'React' }) &&
      (t.isIdentifier(superClass.property, { name: 'Component' }) ||
        t.isIdentifier(superClass.property, { name: 'PureComponent' }))) ||
    t.isIdentifier(superClass, { name: 'Component' }) ||
    t.isIdentifier(superClass, { name: 'PureComponent' })
  );
}

/**
 * Creates a Babel plugin that collects displayName property
 */
export function createBabelDisplayNamePlugin(): PluginItem {
  return ({ types: t }: { types: typeof babel.types }): PluginObj => ({
      /**
       * Visit AST and collect displayName or componentName
       */
      visitor: {
        // function A () {}
        FunctionDeclaration(
          path: babel.NodePath<babel.types.FunctionDeclaration>,
        ) {
          const node = path.node;
          if (isReactFunctionComponent(node, t)) {
            const componentName = node.id.name;
            const existingDisplayName =
              findDisplayNameAssignmentInScope(path, t, componentName) ||
              componentName;
            store.SELF_REACT_COMPONENTS.add(existingDisplayName);
          }
        },

        // const App = ...
        VariableDeclarator(
          path: babel.NodePath<babel.types.VariableDeclarator>,
        ) {
          const node = path.node;
          // we only care about the case we have identifier on the LHS
          if (!t.isIdentifier(node.id)) return;
          if (
            // const App = () => {} or const App = function () {}
            (t.isArrowFunctionExpression(node.init) ||
              t.isFunctionExpression(node.init)) &&
            node.id &&
            isReactFunctionComponent(node.init, t)
          ) {
            const componentName = node.id.name;
            const existingDisplayName =
              findDisplayNameAssignmentInScope(path, t, componentName) ||
              componentName;
            store.SELF_REACT_COMPONENTS.add(existingDisplayName);
          } else if (
            // const App = class extends React.Component {}
            t.isClassExpression(node.init) &&
            isReactClassComponent(node.init, t)
          ) {
            const componentName = node.id.name;
            const existingDisplayName =
              findDisplayNameAssignmentInScope(path, t, componentName) ||
              findDisplayNamePropertyInClassExpression(
                path,
                t,
                componentName,
              ) ||
              componentName;
            store.SELF_REACT_COMPONENTS.add(existingDisplayName);
          } else if (t.isCallExpression(node.init)) {
            const pathRight = path.get('init');
            const componentName = node.id.name;
            pathRight.traverse({
              FunctionExpression(
                innerPath: babel.NodePath<babel.types.FunctionExpression>,
              ) {
                const node = innerPath.node;
                if (isReactFunctionComponent(node, t)) {
                  const existingDisplayName =
                    findDisplayNameAssignmentInScope(
                      innerPath,
                      t,
                      componentName,
                    ) || componentName;
                  store.SELF_REACT_COMPONENTS.add(existingDisplayName);
                }
              },
              ArrowFunctionExpression(
                innerPath: babel.NodePath<babel.types.ArrowFunctionExpression>,
              ) {
                const node = innerPath.node;
                if (isReactFunctionComponent(node, t)) {
                  const existingDisplayName =
                    findDisplayNameAssignmentInScope(
                      innerPath,
                      t,
                      componentName,
                    ) || componentName;
                  store.SELF_REACT_COMPONENTS.add(existingDisplayName);
                }
              },
              ClassExpression(
                innerPath: babel.NodePath<babel.types.ClassExpression>,
              ) {
                const node = innerPath.node;
                if (isReactClassComponent(node, t)) {
                  const existingDisplayName =
                    findDisplayNameAssignmentInScope(
                      innerPath,
                      t,
                      componentName,
                    ) ||
                    findDisplayNamePropertyInClassExpression(
                      innerPath,
                      t,
                      componentName,
                    ) ||
                    componentName;
                  store.SELF_REACT_COMPONENTS.add(existingDisplayName);
                }
              },
            });
          }
        },

        // class App extends React.Component {}
        ClassDeclaration(path: babel.NodePath<babel.types.ClassDeclaration>) {
          const node = path.node;
          if (isReactClassComponent(node, t)) {
            const componentName = node.id.name;
            const existingDisplayName =
              findDisplayNameAssignmentInScope(path, t, componentName) ||
              findDisplayNamePropertyInClassExpression(
                path,
                t,
                componentName,
              ) ||
              componentName;
            store.SELF_REACT_COMPONENTS.add(existingDisplayName);
          }
        },
      },
    });
}

// TODO: use traverse
/**
 * Check if a path represents a React component (returns JSX)
 */
function isReactFunctionComponent(
  node:
    | babel.types.ArrowFunctionExpression
    | babel.types.FunctionExpression
    | babel.types.FunctionDeclaration,
  t: typeof babel.types,
) {
  // For arrow functions with expression body (implicit return)
  if (!t.isBlockStatement(node.body)) {
    return (
      isJSXNode(node.body, t) ||
      (t.isParenthesizedExpression(node.body) &&
        isJSXNode(node.body.expression, t))
    );
  }

  return searchForJSXReturn(node.body, t);
}

// Helper to check if a node is a JSX element or fragment
function isJSXNode(node: babel.types.Expression, t: typeof babel.types) {
  return t.isJSXElement(node) || t.isJSXFragment(node);
}

function searchForJSXReturn(
  node: babel.types.Statement | babel.types.Expression,
  t: typeof babel.types,
) {
  if (!node) return false;

  // Handle return statements
  if (t.isReturnStatement(node) && node.argument) {
    return isJSXNode(node.argument, t);
  }

  // Arrow function expressions in arguments or expressions
  if (
    t.isArrowFunctionExpression(node) ||
    t.isFunctionExpression(node) ||
    t.isFunctionDeclaration(node)
  ) {
    return isReactFunctionComponent(node, t);
  }

  // Array of statements (function body, block statement, etc.)
  if (t.isBlockStatement(node)) {
    return node.body.some((statement) => searchForJSXReturn(statement, t));
  }

  // If statement
  if (t.isIfStatement(node)) {
    return (
      searchForJSXReturn(node.consequent, t) ||
      (node.alternate && searchForJSXReturn(node.alternate, t))
    );
  }

  // Switch statement
  if (t.isSwitchStatement(node)) {
    return node.cases.some((switchCase) =>
      switchCase.consequent.some((statement) =>
        searchForJSXReturn(statement, t),
      ),
    );
  }

  // Try statement
  if (t.isTryStatement(node)) {
    return (
      searchForJSXReturn(node.block, t) ||
      (node.handler && searchForJSXReturn(node.handler.body, t)) ||
      (node.finalizer && searchForJSXReturn(node.finalizer, t))
    );
  }

  // For loop
  if (
    t.isForStatement(node) ||
    t.isForInStatement(node) ||
    t.isForOfStatement(node)
  ) {
    return searchForJSXReturn(node.body, t);
  }

  // While and do-while loops
  if (t.isWhileStatement(node) || t.isDoWhileStatement(node)) {
    return searchForJSXReturn(node.body, t);
  }

  // Labeled statement
  if (t.isLabeledStatement(node)) {
    return searchForJSXReturn(node.body, t);
  }

  // Ternary expression
  if (t.isConditionalExpression(node)) {
    return (
      searchForJSXReturn(node.consequent, t) ||
      searchForJSXReturn(node.alternate, t)
    );
  }

  // Logical expressions (&&, ||)
  if (t.isLogicalExpression(node)) {
    return (
      searchForJSXReturn(node.left, t) || searchForJSXReturn(node.right, t)
    );
  }

  if (t.isArrayExpression(node)) {
    return node.elements.some((element) => {
      if (t.isExpression(element)) {
        return searchForJSXReturn(element, t);
      }
    });
  }

  return false;
}
