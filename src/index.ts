import {
  ChangeGroupOptions,
  Condition,
  Config,
  DecomposeOptions,
  Entry,
  Item,
  Section,
} from './types/index.js';

export * from './types/index.js';

export function compose(config: Config, sections: Partial<Section<Partial<Item>>>[]) {
  const combined: Config = {
    name: config.name,
    label: config.label,
    sections: [],
  };

  config.sections.forEach((section: Section) => {
    const combinedSection: Section = {
      name: section.name,
      label: section.label,
      items: [],
    };

    const resultSection = sections.find((s) => s.name === section.name);

    if (!resultSection) {
      throw new Error(`Section "${section.name}" not found`);
    }

    const formData: Record<string, any> = resultSection.items.reduce((acc, item) => {
      acc[item.name] = item.entry;
      return acc;
    }, {});

    section.items.forEach((item: Item) => {
      const resultItem = resultSection.items.find((resultItem) => resultItem.name === item.name);

      if (!resultItem) {
        throw new Error(`Result missing for field "${item.name}".`);
      }

      validateItem(item, resultItem.entry, formData);

      const combinedItem = {
        ...item,
        entry: resultItem.entry,
      };

      if (resultItem?.comment) {
        combinedItem.comment = resultItem.comment;
      }

      if (resultItem?.media) {
        combinedItem.media = resultItem.media;
      }

      combinedSection.items.push(combinedItem);
    });

    combined.sections.push(combinedSection);
  });

  return combined;
}

function validateItem(item: Item, entry: Entry, formData: Record<string, Entry>) {
  const { validation, conditions } = item;

  // Check condition, if applicable
  if (conditions && !checkCondition(conditions.show, formData)) {
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
        if (allow.includes('value') && item.entry !== undefined) {
          if (item.type === 'select' || item.type === 'radio') {
            const selectedOption = item.options?.find((opt) => opt.value === item.entry);
            if (selectedOption) {
              decomposedItem.value = selectedOption.label;
            }
          } else if (item.type === 'group' && Array.isArray(item.entry)) {
            const selectedLabels = item.options
              ?.filter((opt) => (item.entry as string[]).includes(opt.value))
              .map((opt) => opt.label);
            decomposedItem.value = selectedLabels?.join(', ');
          } else {
            decomposedItem.value = item.entry as string;
          }
        }

        return decomposedItem;
      }),
    })),
  };
}

export function evaluate(config: Config, factor = 100): Config {
  // Evaluate section
  const sectionAnalysis = config.sections.map((section) => {
    const { total, weight } = evaluateSection(section);

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
    total,
    ratio: parseFloat(ratio.toFixed(1)),
  };
}

function evaluateSection(section: Section) {
  return section.items.reduce(
    (acc, item) => {
      const entry = item.entry || item.default;
      let selectedOptionWeight = 0;
      const itemWeight = item?.weight ?? 0;

      if (item.type === 'select' && entry) {
        const selectedOption = item?.options?.find((option) => option.value === entry);
        selectedOptionWeight = selectedOption ? selectedOption?.weight ?? 0 : 0;
      } else if (item.type === 'group' && Array.isArray(entry)) {
        const selectedSubItems = item?.subItems?.filter((subItem) => entry.includes(subItem.name));
        selectedOptionWeight = selectedSubItems
          ? selectedSubItems.reduce(
              (sum, selectedSubItem) => sum + (selectedSubItem?.weight ?? 0),
              0,
            )
          : 0;
      } else if (
        item.subType === 'scale' &&
        typeof entry === 'number' &&
        Array.isArray(item.tiers)
      ) {
        const applicableTier =
          item.tiers.find((tier) => entry <= tier.maxValue) || item.tiers[item.tiers.length - 1];
        const rate = applicableTier?.rate ?? 1;
        selectedOptionWeight = itemWeight * rate;
      } else if (entry !== undefined) {
        selectedOptionWeight = itemWeight;
      }

      return {
        total: acc.total + selectedOptionWeight,
        weight: acc.weight + itemWeight,
      };
    },
    { total: 0, weight: 0 },
  );
}

export function evaluateCondition(condition?: Condition, formState?: Record<string, any>) {
  if (!condition || !formState) {
    return true;
  }

  return checkCondition(condition, formState);
}

export function checkCondition(condition: Condition, formState: Record<string, any>): boolean {
  if (condition.and) {
    return condition.and.every((cond) => checkCondition(cond, formState));
  }
  if (condition.or) {
    return condition.or.some((cond) => checkCondition(cond, formState));
  }
  if (condition.field && condition.operator) {
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

export function stage(config: Config<Section<Item>>): Record<string, any> {
  return config.sections.reduce((acc, section) => {
    section.items.forEach((item) => {
      if (item.default !== undefined) {
        acc[item.name] = item.default;
      } else {
        acc[item.name] = item.type === 'group' && /list/i.test(item.subType) ? [] : '';
      }

      if (item.subItems && item.type === 'group' && !/list/i.test(item.subType)) {
        item.subItems.forEach((subItem) => {
          acc[subItem.name] = subItem.default ?? '';
        });
      }
    });
    return acc;
  }, {});
}

export const getChangeGroup =
  ({ item, group, setGroup }: ChangeGroupOptions) =>
  (value: string) => {
    if (group[item.name]) {
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
        if (formState.hasOwnProperty(item.name)) {
          preparedItem.entry = formState[item.name];
        }
        if (item.comment) preparedItem.comment = item.comment;
        if (item.media) preparedItem.media = item.media;
        return preparedItem as Item;
      }),
    })),
  };
}

export function getYears(startYear: number, endYear?: number) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= (endYear ?? currentYear); year++) {
    years.push(year);
  }
  return years;
}
