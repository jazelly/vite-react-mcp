import * as babel from '@babel/core';
import { PluginItem } from '@babel/core';
import { PluginObj } from '@babel/core';

export function addDisplayNamePropertyToClassDeclaration(
  path: babel.NodePath<babel.types.ClassDeclaration>,
  t: typeof babel.types,
  suffix: string,
  componentName: string,
) {
  if (!t.isClassDeclaration(path.node)) return;

  const displayName = `${componentName}_${suffix}`;
  let hasDisplayName = false;
  // For class components
  if (path.get('body')) {
    path.get('body').traverse({
      ClassProperty(propertyPath: babel.NodePath<babel.types.ClassProperty>) {
        // e.g. class App extends React.Component {
        //        static displayName = 'App_mcp'
        //      }
        if (
          t.isIdentifier(propertyPath.node.key, { name: 'displayName' }) &&
          propertyPath.node.static
        ) {
          hasDisplayName = true;
        }
      },
    });

    // class not having displayName
    if (!hasDisplayName) {
      const property = t.classProperty(
        t.identifier('displayName'),
        t.stringLiteral(displayName),
        null,
        null,
        null,
        true, // static
      );

      path.get('body').unshiftContainer('body', property);
    }
  }
}

export const getDisplayNameAssignmentToLVal = (
  LVal: babel.types.Identifier,
  t: typeof babel.types,
  displayName: string,
): babel.types.ExpressionStatement => {
  const assignment = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(LVal, t.identifier('displayName')),
      t.stringLiteral(displayName),
    ),
  );
  return assignment;
};

/**
 * Add displayName property to a component
 */
export function addDisplayNamePropertyAfter(
  path: babel.NodePath<babel.types.Node>,
  t: typeof babel.types,
  suffix: string,
  componentName: string,
) {
  const displayName = `${componentName}_${suffix}`;
  const parent = path.parent;
  if (!parent) return;
  if (!componentName || typeof componentName !== 'string') return;
  const assignment = getDisplayNameAssignmentToLVal(
    t.identifier(componentName),
    t,
    displayName,
  );
  path.insertAfter(assignment);
}

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
  let returnsJsx = false;

  if (t.isArrowFunctionExpression(node)) {
    // For arrow functions with implicit return
    if (
      t.isJSXElement(node.body) ||
      t.isJSXFragment(node.body) ||
      t.isJSXExpressionContainer(node.body)
    ) {
      return true;
    }

    // For arrow functions with block body
    if (t.isBlockStatement(node.body)) {
      node.body.body.forEach((statement) => {
        if (
          t.isReturnStatement(statement) &&
          statement.argument &&
          (t.isJSXElement(statement.argument) ||
            t.isJSXFragment(statement.argument) ||
            t.isJSXExpressionContainer(statement.argument))
        ) {
          returnsJsx = true;
        }
      });
    }
  } else if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) {
    node.body.body.forEach((statement) => {
      if (
        t.isReturnStatement(statement) &&
        statement.argument &&
        (t.isJSXElement(statement.argument) ||
          t.isJSXFragment(statement.argument) ||
          t.isJSXExpressionContainer(statement.argument))
      ) {
        returnsJsx = true;
      }
    });
  }

  return returnsJsx;
}

/**
 * Check if a path represents a React class component
 */
function isReactClassComponent(
  node: babel.types.ClassExpression | babel.types.ClassDeclaration,
  t: typeof babel.types,
) {
  // Check if class extends React.Component or Component
  const superClass = node.superClass;
  if (!superClass) return false;
  if (
    (t.isMemberExpression(superClass) &&
      t.isIdentifier(superClass.object, { name: 'React' }) &&
      t.isIdentifier(superClass.property, { name: 'Component' })) ||
    t.isIdentifier(superClass, { name: 'Component' })
  ) {
    return true;
  }

  return false;
}

/**
 * Creates a Babel plugin that adds displayName property to components
 */
export function createBabelDisplayNamePlugin(
  suffix: string,
  filename: string,
): PluginItem {
  return function ({ types: t }: { types: typeof babel.types }): PluginObj {
    return {
      visitor: {
        // Handle function components
        FunctionDeclaration(
          path: babel.NodePath<babel.types.FunctionDeclaration>,
        ) {
          const node = path.node;
          if (isReactFunctionComponent(node, t)) {
            addDisplayNamePropertyAfter(path, t, suffix, node.id.name);
          }
        },

        VariableDeclarator(path: babel.NodePath<babel.types.Node>) {
          const node = path.node as babel.types.VariableDeclarator;
          if (
            // const App = () => {} or const App = function () {}
            (t.isArrowFunctionExpression(node.init) ||
              t.isFunctionExpression(node.init)) &&
            node.id &&
            isReactFunctionComponent(node.init, t)
          ) {
            if (t.isIdentifier(node.id)) {
              addDisplayNamePropertyAfter(path, t, suffix, node.id.name);
            }
          } else if (
            // const App = class extends React.Component {}
            t.isClassExpression(node.init) &&
            isReactClassComponent(node.init, t)
          ) {
            if (t.isIdentifier(node.id)) {
              addDisplayNamePropertyAfter(path, t, suffix, node.id.name);
            }
          }
        },

        ClassDeclaration(path: babel.NodePath<babel.types.ClassDeclaration>) {
          const node = path.node;
          if (isReactClassComponent(node, t)) {
            addDisplayNamePropertyToClassDeclaration(
              path,
              t,
              suffix,
              node.id.name,
            );
          }
        },

        // TODO: ExportDefaultDeclaration
        // export default function App() {}                         - decouple
        // export default const App = ()=>{}                        - decouple
        // export default class App extends React.Component {}      - inject
        // export default class extends React.component {}          - inject with filename
        // export default () => {}                                  - decouple, assign, export named
        // export default function () {}                            - decouple, assign, export named
        // ignore all other cases
      },
    };
  };
}
