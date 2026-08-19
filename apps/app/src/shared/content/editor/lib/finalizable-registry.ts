export abstract class FinalizableRegistry<
  Definition,
  Definitions extends readonly Definition[] = readonly Definition[],
> {
  private readonly definitionsByKey = new Map<string, Definition>();
  private readonly orderedDefinitions: Definition[] = [];
  private finalized = false;

  protected abstract readonly definitionLabel: string;
  protected abstract readonly registryLabel: string;

  finalize(): this {
    if (this.finalized) return this;

    this.validateFinalization();
    this.finalized = true;
    return this;
  }

  getDefinitions(): Definitions {
    // SAFETY: `Definitions` is a tuple the subclass accumulates one `register`

    // eslint-disable-next-line anti-slop/no-chained-type-assertions -- see above
    return this.orderedDefinitions as unknown as Definitions;
  }

  protected abstract getDefinitionKey(definition: Definition): string;

  protected assertFinalized(operation: string): void {
    if (!this.finalized) {
      throw new Error(
        `The ${this.registryLabel} must be finalized before ${operation}.`,
      );
    }
  }

  protected getDefinition(key: string): Definition | undefined {
    return this.definitionsByKey.get(key);
  }

  protected getDuplicateDefinitionError(key: string): string {
    return `Duplicate ${this.definitionLabel} "${key}".`;
  }

  protected registerDefinitions(...definitions: readonly Definition[]): void {
    this.assertMutable();

    for (const definition of definitions) {
      const key = this.getDefinitionKey(definition);
      if (this.definitionsByKey.has(key)) {
        throw new Error(this.getDuplicateDefinitionError(key));
      }

      this.validateDefinition(definition);
      this.definitionsByKey.set(key, definition);
      this.orderedDefinitions.push(definition);
      this.onRegister(definition);
    }
  }

  protected onRegister(_definition: Definition): void {
    return;
  }

  protected validateDefinition(_definition: Definition): void {
    return;
  }

  protected validateFinalization(): void {
    return;
  }

  protected assertMutable(): void {
    if (this.finalized) {
      throw new Error(`The ${this.registryLabel} is already finalized.`);
    }
  }
}
