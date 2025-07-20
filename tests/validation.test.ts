import { Config, Item, Section } from '../src/index';

// Import internal validation functions by testing through compose function
import { compose } from '../src/index';

describe('Validation Functions', () => {
  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    name: 'testField',
    type: 'text',
    label: 'Test Field',
    ...overrides,
  });

  const createMockSection = (items: Item[], overrides: Partial<Section> = {}): Section => ({
    name: 'testSection',
    label: 'Test Section',
    items,
    ...overrides,
  });

  const createMockConfig = (sections: Section[], overrides: Partial<Config> = {}): Config => ({
    name: 'testConfig',
    label: 'Test Config',
    sections,
    ...overrides,
  });

  describe('Required Validation', () => {
    it('should pass validation when required field has value', () => {
      const item = createMockItem({
        validation: { required: true },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'test value' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail validation when required field is empty string', () => {
      const item = createMockItem({
        validation: { required: true },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: '' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" is required.'
      );
    });

    it('should fail validation when required field is null', () => {
      const item = createMockItem({
        validation: { required: true },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: null as any }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" is required.'
      );
    });

    it('should fail validation when required field is undefined', () => {
      const item = createMockItem({
        validation: { required: true },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: undefined as any }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" is required.'
      );
    });
  });

  describe('Number Validation', () => {
    it('should pass min validation when number is greater than minimum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { min: 5 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 10 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should pass min validation when number equals minimum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { min: 5 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 5 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail min validation when number is less than minimum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { min: 5 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 3 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" must be at least 5.'
      );
    });

    it('should pass max validation when number is less than maximum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { max: 10 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 8 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should pass max validation when number equals maximum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { max: 10 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 10 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail max validation when number is greater than maximum', () => {
      const item = createMockItem({
        type: 'number',
        validation: { max: 10 },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 15 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" cannot be greater than 10.'
      );
    });
  });

  describe('Allowed Values Validation', () => {
    it('should pass validation when value is in allowed values', () => {
      const item = createMockItem({
        type: 'select',
        validation: { allowedValues: ['option1', 'option2', 'option3'] },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'option2' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail validation when value is not in allowed values', () => {
      const item = createMockItem({
        type: 'select',
        validation: { allowedValues: ['option1', 'option2', 'option3'] },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'invalidOption' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" must be one of option1, option2, option3.'
      );
    });
  });

  describe('File Extension Validation', () => {
    it('should pass validation for correct file extension', () => {
      const item = createMockItem({
        type: 'file',
        validation: { accept: '.jpg,.png,.gif' },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'image.jpg' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should pass validation for wildcard pattern', () => {
      const item = createMockItem({
        type: 'file',
        validation: { accept: 'image/*' },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'image.png' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail validation for incorrect file extension', () => {
      const item = createMockItem({
        type: 'file',
        validation: { accept: '.jpg,.png' },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'document.pdf' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" must be of type .jpg,.png.'
      );
    });

    it('should fail validation for file without extension', () => {
      const item = createMockItem({
        type: 'file',
        validation: { accept: '.jpg,.png' },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 'filename' }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" must be of type .jpg,.png.'
      );
    });
  });

  describe('Conditional Validation', () => {
    it('should skip validation when show condition is not met', () => {
      const item = createMockItem({
        validation: { required: true },
        conditions: {
          show: {
            field: 'otherField',
            operator: 'EQUAL',
            value: 'showMe',
          },
        },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [
            { name: 'testField', entry: '' }, // Required but empty
            { name: 'otherField', entry: 'hideMe' }, // Condition not met
          ],
        },
      ];

      // Should not throw because condition is not met, so validation is skipped
      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should perform validation when show condition is met', () => {
      const item = createMockItem({
        validation: { required: true },
        conditions: {
          show: {
            field: 'otherField',
            operator: 'EQUAL',
            value: 'showMe',
          },
        },
      });
      const otherItem = createMockItem({
        name: 'otherField',
        type: 'text',
      });
      const section = createMockSection([item, otherItem]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [
            { name: 'testField', entry: '' }, // Required but empty
            { name: 'otherField', entry: 'showMe' }, // Condition met
          ],
        },
      ];

      // Should throw because condition is met and field is required but empty
      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" is required.'
      );
    });
  });

  describe('Combined Validations', () => {
    it('should validate multiple rules on the same field', () => {
      const item = createMockItem({
        type: 'number',
        validation: {
          required: true,
          min: 5,
          max: 10,
        },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: 7 }],
        },
      ];

      expect(() => compose(config, sections, { validate: true })).not.toThrow();
    });

    it('should fail on first validation error encountered', () => {
      const item = createMockItem({
        type: 'number',
        validation: {
          required: true,
          min: 5,
          max: 10,
        },
      });
      const section = createMockSection([item]);
      const config = createMockConfig([section]);

      const sections = [
        {
          name: 'testSection',
          items: [{ name: 'testField', entry: '' }], // Fails required validation first
        },
      ];

      expect(() => compose(config, sections, { validate: true })).toThrow(
        'Field "testField" is required.'
      );
    });
  });
});