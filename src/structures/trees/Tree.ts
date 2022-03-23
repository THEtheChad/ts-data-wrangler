type Filter<T> = (node: T) => boolean;
type ChildAccessor<T> = (node: T) => Array<T>
type KeyAccessor<T> = (node: T) => any;

export class Node<T> {
  key: any;

  datum: T;

  parent: Node<T> | null;
  children: Array<Node<T>>;

  constructor(
    source: T,
    childAccessor: ChildAccessor<T>,
    keyAccessor?: KeyAccessor<T>,
    keys: Set<any> = new Set(),
    parent?: Node<T>
  ) {
    this.key = keyAccessor ? keyAccessor(source) : `Node-${++Node.UUID}`;

    if (keys.size === keys.add(this.key).size)
      throw new Error(`Duplicate key detected: ${this.key}`);

    this.datum = source

    this.parent = parent ?? null;
    this.children = childAccessor(source).map((child) => new Node(child, childAccessor, keyAccessor, keys, this))
  }

  static UUID = 0;
}

interface TreeOptions<T> {
	childAccessor?: ChildAccessor<T>
	keyAccessor?: KeyAccessor<T>
}
export class Tree<T> {
	#childAccessor: ChildAccessor<Node<T>> = (node) => node.children
	#keyAccessor: KeyAccessor<Node<T>> = (node) => node.key
	#structure: Node<T>
	readonly keys = new Set<any>()

	constructor(structure: T, {childAccessor, keyAccessor}: TreeOptions<T>){
		const accessor = childAccessor ?? ((node: any) => node.children ?? [])
		this.#structure = new Node(structure, accessor, keyAccessor, this.keys)
	}

	flatten(filter?: Filter<Node<T>>){
		return flatten(this.#structure, filter, this.#childAccessor)
	}

	find(key: any){
		return find(this.#structure, key, this.#keyAccessor, this.#childAccessor)
	}
}

export function find<T>(
  node: T,
  key: any,
	keyAccessor: KeyAccessor<T>,
  childAccessor: ChildAccessor<T>,
  path: Array<T> = []
): { node: T; path: Array<T> } | undefined {
	if(keyAccessor(node) === key) return {node, path};
  path.push(node);

  const children = childAccessor(node)

  for (let i in children) {
    const result = find(children[i], key, keyAccessor, childAccessor, [...path]);
    if (result) return result;
  }
}

export function flatten<T>(
  node: T,
  filter: Filter<T> = () => true,
  childAccessor: ChildAccessor<T>,
  memo: Array<T> = []
): Array<T> {
  if (filter(node)) memo.push(node);
  childAccessor(node).forEach((child: any) => flatten(child, filter, childAccessor, memo));
  return memo;
}

export default Tree
