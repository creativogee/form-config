export interface Validation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: string[];
  allowedExtensions?: string[];
}

export interface Option {
  upvote?: boolean;
  downvote?: boolean;
  novote?: boolean;
  id?: string;
  value: string;
  label: string;
  weight?: number;
}

export type Entry = string | number | string[];

export interface Tier {
  maxValue: string;
  rate: number;
}

export type ItemType =
  | 'text'
  | 'number'
  | 'password'
  | 'select'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'email'
  | 'tel'
  | 'url'
  | 'hidden'
  | 'file'
  | 'button'
  | 'color'
  | 'datetime-local'
  | 'image'
  | 'month'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'time'
  | 'week'
  | 'textarea'
  | 'group';

export type MediaType = 'image' | 'video' | 'audio';

export type ConditionOperator = 'EQUAL' | 'NOT_EQUAL' | 'EMPTY' | 'NOT_EMPTY';

export type DataSource = 'options' | 'url' | 'arbitrary';

export interface Item {
  name: string; // must be unique
  entry?: Entry;
  comment?: string;
  media?: Media[];
  //
  // the below fields are to be decomposed before storage
  //
  tabIndex?: number;
  label: string;
  value?: any;
  description?: string;
  devNote?: string;
  placeholder?: string;
  type: ItemType;
  subType?: string;
  weight?: number;
  tiers?: Tier[];
  default?: string | number | boolean | string[];
  style?: string;
  disabled?: boolean;
  hidden?: boolean;
  conditions?: {
    enable?: Condition;
    show?: Condition;
  };
  dataSource?: DataSource;
  url?: string;
  template?: string;
  validation?: Validation;
  options?: Option[];
  subItems?: Item[];
}

export interface Media {
  type: MediaType;
  url: string;
}

export interface MixedCondition {
  and?: Condition[];
  or?: Condition[];
}

export interface Condition extends MixedCondition {
  field?: string;
  operator?: ConditionOperator;
  value?: string;
}

export interface Section<T = Item> {
  name: string;
  label?: string;
  weight?: number;
  total?: number;
  ratio?: number;
  comment?: string;
  items: T[];
  subSections?: Section<T>[];
}

export interface Config<T = Section<Item>> {
  name: string;
  label: string;
  total?: number;
  ratio?: number;
  comment?: string;
  sections: T[];
}

export interface DecomposeOptions {
  allow?: Array<keyof Item>;
}

export interface ChangeGroupOptions {
  item: Item;
  group: Record<string, string[]>;
  setGroup: (group: Record<string, any[]>) => void;
}

/**
 *
 * @param condition The condition to evaluate
 * @param formState The form state to evaluate the condition against
 * @description The evaluateCondition function evaluates the condition against the form state. If the condition is met, it returns true; otherwise, it returns false. The condition can be a simple condition with a field, operator, and value, or a complex condition with multiple conditions combined using AND or OR operators. The form state is a record of field names and values. The evaluateCondition function is useful for showing or hiding form fields based on the values of other form fields.
 */
export declare function evaluateCondition(
  condition?: Condition,
  formState?: Record<string, any>,
):
  | boolean
  | {
      visible?: boolean;
      disable?: boolean;
    };

/**
 *
 * @param config The form layout configuration
 * @param factor The factor to multiply the total by to get the star rating
 * @returns The form layout configuration with the total and star rating calculated
 * @description The evaluate function calculates the total and star rating for each section in the form layout configuration. The total is calculated by summing the totals of all items in the section. The star rating is calculated by dividing the total by the weight of the section and multiplying it by the factor. The config total and total weight of all sections are also calculated, and the config total star is calculated by dividing the config total by the total weight and multiplying it by the factor. The updated form layout configuration is returned with the total and star rating calculated for each section and the config total and config total star calculated for the entire form.
 */
export declare function evaluate(config: Config, factor?: number): Config;

/**
 *
 * @param config  The form layout configuration
 * @param sections The form data sections to be combined with the form layout configuration
 * @returns A composition of the form layout configuration and the form data sections
 * @description The compose function combines the form layout configuration with the form data sections to create a new configuration object. The form data sections are combined with the form layout configuration by matching the section names and item names. This function is useful as the client is not required to provide the entire form layout configuration when submitting form data.
 */
export declare function compose(
  config: Config,
  sections: Partial<Section<Partial<Item>>>[],
  options?: { validate?: boolean },
): Config<Section<Item>>;

/**
 *
 * @param config The form layout configuration
 * @param options Decompose options
 * @returns A decomposed form layout configuration
 * @description The decompose function trims down a previously composed form layout configuration and optionally populates the value field. This function is useful when storing the form layout configuration in a database or preparing it for report generation.
 */
export declare function decompose(
  config: Config,
  options?: DecomposeOptions,
): Partial<Config<Partial<Section<Partial<Item>>>>>;

/**
 *
 * @param config The form layout configuration
 * @returns A record of field names and default values
 * @description The stage function takes a form layout configuration and returns a record of field names and default values. The default value is the default value of the field if it exists; otherwise, it is an empty string for text fields, an empty array for checkbox fields, or the first option for select fields. The stage function is useful for initializing form state with default values.
 */
export declare function stage(config: Config<Section<Item>>): Record<string, any>;

/**
 *
 * @param config The form layout configuration
 * @description The validateConfig function validates the form layout configuration. It checks for duplicate section names, item names, and option names. If any duplicates are found, an error message is returned. If no duplicates are found, a success message is returned. It is recommended to validate every new form layout configuration to ensure that it is correct and meets the required standards.
 */
export declare function validate(config: Config): string;

/**
 *
 * @description The getChangeGroup function returns a function that updates the group of an item based on the value selected. The function takes the item, group, setGroup, and value as arguments. The group is a record of group names and item names. The setGroup function is used to update the group. The getChangeGroup function is useful for updating the group of an item based on the value selected in a select field.
 */
export declare function getChangeGroup({
  item,
  group,
  setGroup,
}: ChangeGroupOptions): (value: string) => void;

/**
 *
 * @param formState The current state of the form
 * @param config The form layout configuration
 * @returns A prepared Config object with updated entries
 * @description The prepare function takes the current form state and the form layout configuration, and returns a new Config object. This new object includes the entries from the form state for each item that exists in the formState. It also preserves any existing comments and media for the items. The function is particularly useful for processing form data before submission or for preparing a partial update of the configuration.
 */
export declare function prepare(formState: Record<string, any>, config: Config): Config;

/**
 * Translates the labels in the given configuration using the provided translation function.
 *
 * @param config - The configuration object containing sections and items, each with a label to be translated.
 * @param t - A translation function that takes a key (string) and returns the translated string (string).
 * @returns A new configuration object with all labels translated.
 */
export declare function translate(config: Config, t: (key: string) => string): Config;

/**
 *  Converts the given configuration object to a string.
 * @param config - The configuration object to be converted to a string.
 * @param depth - The depth of the configuration object to be converted to a string.
 */
export declare function stringify(config: Config, depth?: number): string;
