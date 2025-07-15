import {
  ChangeGroupOptions,
  ComposeOptions,
  Condition,
  Config,
  DecomposeOptions,
  Entry,
  Item,
  Option,
  Section,
  Tier,
} from './types/index.js';

export * from './types/index.js';

export function compose(
  config: Config,
  sections: Partial<Section<Partial<Item>>>[],
  options?: ComposeOptions,
) {
  const strict = options?.strict ?? true;
  const validate = options?.validate ?? false;

  const combined: Config = {
    name: config.name,
    label: config.label,
    weight: config.weight,
    comment: config.comment,
    sections: [],
  };

  function processItems(
    items: Item[],
    resultItems: Partial<Item>[],
    formData: Record<string, any>,
  ): Item[] {
    return items.map((item) => {
      const resultItem = resultItems.find((resultItem) => resultItem.name === item.name);

      if (strict && !resultItem) {
        throw new Error(`Result missing for field "${item.name}".`);
      }

      if (validate && resultItem) {
        validateItem(item, resultItem?.entry, formData);
      }

      const combinedItem: Item = {
        ...item,
        ...(resultItem && { ...resultItem }),
        entry: resultItem?.entry ?? item.entry,
      };

      if (item?.subItems && resultItem?.subItems) {
        combinedItem.subItems = processItems(item.subItems, resultItem.subItems, formData);
      }

      return combinedItem;
    });
  }

  config.sections.forEach((configSection: Section) => {
    const combinedSection: Section = {
      name: configSection.name,
      label: configSection.label,
      weight: configSection.weight,
      comment: configSection.comment,
      items: [],
    };

    const resultSection = sections.find((s) => s.name === configSection.name);

    if (strict && !resultSection) {
      throw new Error(`Section "${configSection.name}" not found`);
    }

    const formData: Record<string, any> =
      resultSection?.items?.reduce((acc, item) => {
        acc[item.name] = item.entry;
        if (item?.subItems) {
          item.subItems.forEach((subItem) => {
            acc[subItem.name] = subItem.entry;
          });
        }
        return acc;
      }, {}) ?? {};

    combinedSection.items = processItems(configSection.items, resultSection?.items ?? [], formData);

    combined.sections.push(combinedSection);
  });

  return combined;
}

function validateFileExtension(filename: string, accept: string): boolean {
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  if (!fileExtension) return false;

  const patterns = accept.split(',').map((pattern) => pattern.trim());

  for (const pattern of patterns) {
    if (pattern.startsWith('.')) {
      // Specific extension
      if (fileExtension === pattern.slice(1).toLowerCase()) {
        return true;
      }
    } else if (pattern.includes('/*')) {
      // Wildcard pattern
      const [type] = pattern.split('/');
      if (filename.startsWith(type)) {
        return true;
      }
    }
  }

  return false;
}

function validateItem(item: Item, entry: Entry, formData: Record<string, Entry>) {
  const { validation, conditions } = item ?? {};

  // Check condition, if applicable
  if (conditions?.show && !checkCondition(conditions.show, formData)) {
    return; // Skip validation if condition is not met
  }

  // Required validation
  if (validation?.required && (entry === undefined || entry === null || entry === '')) {
    throw new Error(`Field "${item.name}" is required.`);
  }

  // Min validation (for numbers)
  if (validation?.min !== undefined && typeof entry === 'number' && entry < validation.min) {
    throw new Error(`Field "${item.name}" must be at least ${validation.min}.`);
  }

  // Max validation (for numbers)
  if (validation?.max !== undefined && typeof entry === 'number' && entry > validation.max) {
    throw new Error(`Field "${item.name}" cannot be greater than ${validation.max}.`);
  }

  // Allowed values validation (for selects)
  if (validation?.allowedValues && !validation.allowedValues.includes(entry as string)) {
    throw new Error(`Field "${item.name}" must be one of ${validation.allowedValues.join(', ')}.`);
  }

  // Allowed extension validation (for files)
  if (validation?.accept && item.type === 'file') {
    if (typeof entry === 'string') {
      if (!validateFileExtension(entry, validation.accept)) {
        throw new Error(`Field "${item.name}" must be of type ${validation.accept}.`);
      }
    }

    // TODO: if entry is not a string
  }
}

export function decompose(
  config: Config,
  options?: DecomposeOptions,
): Partial<Config<Partial<Section<Partial<Item>>>>> {
  const { allow = ['name', 'entry'] } = options ?? {};

  return {
    ...config,
    sections: config.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const decomposedItem = Object.fromEntries(
          Object.entries(item).filter(([key]: [keyof Item, unknown]) => allow.includes(key)),
        ) as Partial<Item>;

        // Populate the value field if 'value' is truthy
        if (allow.includes('value') && item?.entry !== undefined) {
          if (item.type === 'select' || item.type === 'radio') {
            const selectedOption = item.options?.find((opt) => opt.value === item.entry);
            if (selectedOption) {
              decomposedItem.value = selectedOption.label;
            }
          } else if (
            item.type === 'group' &&
            Array.isArray(item.entry) &&
            // cannot decompose if entry is neither string or string array
            item.entry.every((entry) => typeof entry === 'string')
          ) {
            const selectedLabels = item.options
              ?.filter((opt) => (item.entry as string[]).includes(opt.value))
              .map((opt) => opt.label);

            decomposedItem.value = selectedLabels?.join(', ');
          } else {
            decomposedItem.value = item.entry;
          }
        }

        return decomposedItem;
      }),
    })),
  };
}

export function evaluate(config: Config, factor = 100): Config {
  // extract the form state from the config
  const formState = unprepare(config);

  // Evaluate section
  const sectionAnalysis = config.sections.map((section) => {
    const { total, weight } = evaluateSection(section, formState);

    // Calculate section ratio
    const ratio = weight ? (total / weight) * factor : 0;

    return {
      ...section,
      total,
      weight,
      ratio: parseFloat(ratio.toFixed(1)),
    };
  });

  // Evaluate config
  const { total, weight } = sectionAnalysis.reduce(
    (acc, section) => ({
      total: acc.total + section.total,
      weight: acc.weight + section.weight,
    }),
    { total: 0, weight: 0 },
  );

  // Calculate config ratio
  const ratio = weight ? (total / weight) * factor : 0;

  // Return the updated config object
  return {
    ...config,
    sections: sectionAnalysis,
    weight,
    total,
    ratio: parseFloat(ratio.toFixed(2)),
  };
}

function evaluateSection(section: Section, formState: Record<string, any>) {
  return section.items.reduce(
    (acc, item) => {
      const {
        entry = item.default,
        weight: itemWeight = 0,
        type,
        subType,
        options,
        subItems,
        tiers,
        dataSource,
        conditions,
      } = item;

      let selectedOptionWeight = 0;

      if (conditions?.show && !checkCondition(conditions.show, formState)) {
        return acc;
      }

      switch (type) {
        case 'select':
        case 'radio':
          selectedOptionWeight = calculateSelectWeight(entry, options, itemWeight, dataSource);
          break;
        case 'group':
          selectedOptionWeight = calculateGroupWeight(entry, subItems, itemWeight);
          break;
        case 'number':
          {
            const isTier = subType === 'scale' && typeof entry === 'number' && Array.isArray(tiers);

            if (isTier) {
              selectedOptionWeight = calculateScaleWeight(entry, tiers, itemWeight);
            }

            if (!isTier) {
              selectedOptionWeight = calculateOtherWeight(entry, itemWeight);
            }
          }
          break;
        default:
          selectedOptionWeight = calculateOtherWeight(entry, itemWeight);
          break;
      }

      return {
        total: acc.total + selectedOptionWeight,
        weight: acc.weight + itemWeight,
      };
    },
    { total: 0, weight: 0 },
  );
}

function calculateSelectWeight(
  entry: any,
  options: Option[],
  itemWeight: number,
  dataSource: string,
) {
  if (!entry) return 0;

  if (dataSource === 'options') {
    const found = options?.find((option) => option.value == entry);
    const weight = found?.weight === undefined ? itemWeight : found.weight;
    return weight;
  }

  return itemWeight;
}

function calculateGroupWeight(entry: any, subItems: Item[], itemWeight: number) {
  if (!Array.isArray(entry)) return 0;

  const isStringArray = entry.every((item) => typeof item === 'string');
  const selectedSubItems = isStringArray
    ? subItems?.filter((subItem) => entry.includes(subItem.name))
    : subItems.slice(0, entry.length);

  const selectedOptionWeight = selectedSubItems
    ? selectedSubItems.reduce((sum, selectedSubItem) => sum + (selectedSubItem?.weight ?? 0), 0)
    : 0;

  return selectedOptionWeight === 0 && entry.length > 0 ? itemWeight : selectedOptionWeight;
}

function calculateScaleWeight(entry: number, tiers: Tier[], itemWeight: number) {
  const applicableTier =
    tiers.find((tier) => entry <= Number(tier.maxValue)) || tiers[tiers.length - 1];
  const rate = applicableTier?.rate ?? 1;
  return itemWeight * rate;
}

function calculateOtherWeight(entry: any, itemWeight: number) {
  if (!entry) return 0;

  return itemWeight;
}

export function evaluateCondition(condition?: Condition, formState?: Record<string, any>) {
  if (!condition || !formState) {
    return true;
  }

  return checkCondition(condition, formState);
}

export function checkCondition(condition: Condition, formState: Record<string, any>): boolean {
  if (condition?.and) {
    return condition.and.every((cond) => checkCondition(cond, formState));
  }
  if (condition?.or) {
    return condition.or.some((cond) => checkCondition(cond, formState));
  }
  if (condition?.field && condition?.operator) {
    const fieldValue = formState[condition.field];
    switch (condition.operator) {
      case 'EQUAL':
        return fieldValue === condition.value;
      case 'NOT_EQUAL':
        return fieldValue !== condition.value;
      case 'NOT_EMPTY':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'EMPTY':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      default:
        return false;
    }
  }
  return false;
}

export function stage<T extends Record<string, any>>(config?: Config<Section<Item>>) {
  if (!config) return {} as T;

  const defaultValues = config.sections.reduce((acc, section) => {
    section.items.forEach((item) => {
      if ((item.type === 'group' && !/list/i.test(item?.subType)) || item.type === 'file') {
        return;
      }

      if (item?.default !== undefined) {
        acc[item.name] = item.default;
      } else {
        acc[item.name] = item.type === 'group' && /list/i.test(item.subType) ? [] : '';
      }

      if (item?.subItems && item.type === 'group' && !/list/i.test(item?.subType)) {
        item.subItems.forEach((subItem) => {
          if (subItem.type !== 'file') {
            acc[subItem.name] = subItem.default ?? '';
          }
        });
      }
    });
    return acc;
  }, {});

  return defaultValues as T;
}

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export const getChangeGroup =
  ({ item, group, setGroup }: ChangeGroupOptions) =>
  (value: any) => {
    const isObject = (val: any) => typeof val === 'object' && val !== null;

    if (group[item.name]) {
      if (isObject(value)) {
        if (group[item.name].some((groupItem: any) => deepEqual(groupItem, value))) {
          setGroup({
            ...group,
            [item.name]: group[item.name].filter((groupItem: any) => !deepEqual(groupItem, value)),
          });
        } else {
          setGroup({
            ...group,
            [item.name]: [...group[item.name], value],
          });
        }
      } else if (typeof value === 'string') {
        if (group[item.name].includes(value)) {
          setGroup({
            ...group,
            [item.name]: group[item.name].filter((item) => item !== value),
          });
        } else {
          setGroup({
            ...group,
            [item.name]: [...group[item.name], value],
          });
        }
      }
    } else {
      setGroup({
        ...group,
        [item.name]: [value],
      });
    }
  };

export function validate(config: Config) {
  const sectionNames = config.sections.map((section) => section.name);
  const sectionNamesSet = new Set(sectionNames);
  if (sectionNames.length !== sectionNamesSet.size) {
    const duplicates = sectionNames.filter((item, index) => sectionNames.indexOf(item) !== index);
    return `Duplicate section names: ${duplicates}`;
  }

  const itemNames = config.sections.map((section) => section.items.map((item) => item.name));
  const itemNamesFlat = itemNames.flat();
  const itemNamesSet = new Set(itemNamesFlat);
  if (itemNamesFlat.length !== itemNamesSet.size) {
    const duplicates = itemNamesFlat.filter((item, index) => itemNamesFlat.indexOf(item) !== index);
    return `Duplicate item names: ${duplicates}`;
  }

  const optionNames = config.sections.map((section) =>
    section.items.map((item) => item?.options?.map((option) => option.value)),
  );
  const optionNamesFlat = optionNames.flat().flat();
  const optionNamesSet = new Set(optionNamesFlat);
  if (optionNamesFlat.length !== optionNamesSet.size) {
    const duplicates = optionNamesFlat.filter(
      (item, index) => optionNamesFlat.indexOf(item) !== index,
    );

    const uniqueDuplicates = [...new Set(duplicates)];
    return `The following names are used more than once: ${uniqueDuplicates}`;
  }

  return 'Hurrah! Your form layout config is valid.';
}

export function prepare(formState: Record<string, any>, config: Config): Config {
  return {
    ...config,
    sections: config.sections.map((section) => ({
      name: section.name,
      items: section.items.map((item) => {
        const preparedItem: Partial<Item> = { name: item.name };
        if (formState.hasOwnProperty(item.name) && formState[item.name] !== '') {
          preparedItem.entry = formState[item.name];
        }
        if (item?.comment) preparedItem.comment = item.comment;
        if (item?.media) preparedItem.media = item.media;
        return preparedItem as Item;
      }),
    })),
  };
}

export function unprepare(config: Config): Record<string, any> {
  return config.sections.reduce((acc, section) => {
    section.items.forEach((item) => {
      if (item.entry !== '') {
        acc[item.name] = item.entry;
      }
      if (item?.subItems) {
        item.subItems.forEach((subItem) => {
          if (subItem.entry !== '') {
            acc[subItem.name] = subItem.entry;
          }
        });
      }
    });
    return acc;
  }, {});
}

export function translate(config: Config, t: (key: string) => string): Config {
  return {
    ...config,
    label: t(config.name),
    sections: config.sections.map((section) => ({
      ...section,
      label: t(section.name),
      items: section.items.map((item) => ({
        ...item,
        label: t(item.name),
      })),
    })),
  };
}

export function stringify(config: Config, depth: number = 1): string {
  if (depth === 2) {
    return JSON.stringify(JSON.stringify(config));
  }

  return JSON.stringify(config);
}
