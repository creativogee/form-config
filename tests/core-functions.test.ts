import {
  checkCondition,
  compose,
  Condition,
  ConditionOperator,
  Config,
  decompose,
  Entry,
  evaluate,
  evaluateCondition,
  getChangeGroup,
  prepare,
  stage,
  stringify,
  translate,
  unprepare,
  validate,
} from "../src/index"

describe("Core Functions", () => {
  const mockConfig: Config = {
    name: "testForm",
    label: "Test Form",
    weight: 100,
    sections: [
      {
        name: "section1",
        label: "Section 1",
        weight: 50,
        items: [
          {
            name: "field1",
            label: "Field 1",
            type: "text",
            weight: 10,
            validation: { required: true },
          },
          {
            name: "field2",
            label: "Field 2",
            type: "select",
            weight: 20,
            options: [
              { value: "option1", label: "Option 1", weight: 5 },
              { value: "option2", label: "Option 2", weight: 15 },
            ],
            dataSource: "options",
          },
          {
            name: "field3",
            label: "Field 3",
            type: "number",
            subType: "scale",
            weight: 20,
            tiers: [
              { maxValue: "10", rate: 0.5 },
              { maxValue: "20", rate: 1.0 },
            ],
          },
        ],
      },
    ],
  }

  describe("compose", () => {
    it("should compose config with sections", () => {
      const sections = [
        {
          name: "section1",
          items: [
            { name: "field1", entry: "test value", type: "text" as const },
            { name: "field2", entry: "option1", type: "select" as const },
            { name: "field3", entry: 15, type: "number" as const },
          ],
        },
      ]

      const result = compose(mockConfig, sections)

      expect(result.sections?.[0]?.items?.[0]?.entry).toBe("test value")
      expect(result.sections?.[0]?.items?.[1]?.entry).toBe("option1")
    })

    it("should throw error in strict mode when section is missing", () => {
      const sections = [
        {
          name: "nonexistent",
          items: [],
        },
      ]

      expect(() => compose(mockConfig, sections, { strict: true })).toThrow(
        'Section "section1" not found',
      )
    })

    it("should throw error in strict mode when field is missing", () => {
      const sections = [
        {
          name: "section1",
          items: [{ name: "field1", entry: "test", type: "text" as const }],
        },
      ]

      expect(() => compose(mockConfig, sections, { strict: true })).toThrow(
        'Result missing for field "field2"',
      )
    })

    it("should validate entries when validate option is true", () => {
      const sections = [
        {
          name: "section1",
          items: [
            { name: "field1", entry: "", type: "text" as const }, // Required field empty
            { name: "field2", entry: "option1", type: "select" as const },
            { name: "field3", entry: 5, type: "number" as const },
          ],
        },
      ]

      expect(() => compose(mockConfig, sections, { validate: true })).toThrow(
        'Field "field1" is required.',
      )
    })
  })

  describe("decompose", () => {
    it("should decompose config with default options", () => {
      const configWithEntries: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              { ...mockConfig.sections[0]!.items![0]!, entry: "test value" },
              { ...mockConfig.sections[0]!.items![1]!, entry: "option1" },
              { ...mockConfig.sections[0]!.items![2]!, entry: 15 },
            ],
          },
        ],
      }

      const result = decompose(configWithEntries)

      expect(result.sections?.[0]?.items?.[0]).toEqual({
        name: "field1",
        entry: "test value",
      })
      expect(result.sections?.[0]?.items?.[1]).toEqual({
        name: "field2",
        entry: "option1",
      })
    })

    it("should include value field when specified in allow options", () => {
      const configWithEntries: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              { ...mockConfig.sections[0]!.items![1]!, entry: "option1" },
            ],
          },
        ],
      }

      const result = decompose(configWithEntries, {
        allow: ["name", "entry", "value"],
      })

      expect(result.sections?.[0]?.items?.[0]?.value).toBe("Option 1")
    })
  })

  describe("evaluate", () => {
    it("should evaluate config with correct totals and ratios", () => {
      const configWithEntries: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              { ...mockConfig.sections[0]!.items![0]!, entry: "test value" },
              { ...mockConfig.sections[0]!.items![1]!, entry: "option2" },
              { ...mockConfig.sections[0]!.items![2]!, entry: 15 },
            ],
          },
        ],
      }

      const result = evaluate(configWithEntries)

      // field1 (text): weight 10
      // field2 (select): option2 weight 15
      // field3 (scale): 15 * rate 1.0 * weight 20 = 20
      // Total: 10 + 15 + 20 = 45
      expect(result.sections?.[0]?.total).toBe(45)
      expect(result.sections?.[0]?.weight).toBe(50)
      expect(result.sections?.[0]?.ratio).toBe(90) // (45/50) * 100
      expect(result.total).toBe(45)
      expect(result.weight).toBe(50)
      expect(result.ratio).toBe(90)
    })

    it("should handle empty entries", () => {
      const result = evaluate(mockConfig)

      expect(result.sections?.[0]?.total).toBe(0)
      expect(result.sections?.[0]?.ratio).toBe(0)
    })
  })

  describe("evaluateCondition", () => {
    const formState = { field1: "test", field2: "", field3: 10 }

    it("should return true for EQUAL condition when values match", () => {
      const condition: Condition = {
        field: "field1",
        operator: "EQUAL",
        value: "test",
      }

      expect(evaluateCondition(condition, formState)).toBe(true)
    })

    it("should return false for EQUAL condition when values do not match", () => {
      const condition: Condition = {
        field: "field1",
        operator: "EQUAL",
        value: "different",
      }

      expect(evaluateCondition(condition, formState)).toBe(false)
    })

    it("should return true for NOT_EMPTY condition when field has value", () => {
      const condition: Condition = {
        field: "field1",
        operator: "NOT_EMPTY",
      }

      expect(evaluateCondition(condition, formState)).toBe(true)
    })

    it("should return true for EMPTY condition when field is empty", () => {
      const condition: Condition = {
        field: "field2",
        operator: "EMPTY",
      }

      expect(evaluateCondition(condition, formState)).toBe(true)
    })

    it("should handle AND conditions", () => {
      const condition: Condition = {
        and: [
          { field: "field1", operator: "NOT_EMPTY" },
          { field: "field2", operator: "EMPTY" },
        ],
      }

      expect(evaluateCondition(condition, formState)).toBe(true)
    })

    it("should handle OR conditions", () => {
      const condition: Condition = {
        or: [
          { field: "field1", operator: "EQUAL", value: "wrong" },
          { field: "field2", operator: "EMPTY" },
        ],
      }

      expect(evaluateCondition(condition, formState)).toBe(true)
    })

    it("should return true when no condition is provided", () => {
      expect(evaluateCondition()).toBe(true)
      expect(evaluateCondition(undefined, formState)).toBe(true)
    })
  })

  describe("stage", () => {
    it("should return default values for form fields", () => {
      const configWithDefaults: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              {
                ...mockConfig.sections[0]!.items![0]!,
                default: "default text",
              },
              { ...mockConfig.sections[0]!.items![1]!, default: "option1" },
              { ...mockConfig.sections[0]!.items![2]!, default: 5 },
            ],
          },
        ],
      }

      const result = stage(configWithDefaults)

      expect(result).toEqual({
        field1: "default text",
        field2: "option1",
        field3: 5,
      })
    })

    it("should return empty values when no defaults are provided", () => {
      const result = stage(mockConfig)

      expect(result).toEqual({
        field1: "",
        field2: "",
        field3: "",
      })
    })

    it("should handle group type with list subtype", () => {
      const configWithGroup: Config = {
        name: "test",
        label: "Test",
        sections: [
          {
            name: "section1",
            items: [
              {
                name: "groupField",
                type: "group",
                subType: "list",
                default: ["item1"],
              },
            ],
          },
        ],
      }

      const result = stage(configWithGroup)
      expect(result.groupField).toEqual(["item1"])
    })

    it("should return empty object when no config is provided", () => {
      const result = stage()
      expect(result).toEqual({})
    })
  })

  describe("validate", () => {
    it("should return success message for valid config", () => {
      // Create a config without items that have null options
      const validConfig: Config = {
        name: "testForm",
        label: "Test Form",
        weight: 100,
        sections: [
          {
            name: "section1",
            label: "Section 1",
            weight: 50,
            items: [
              {
                name: "field2",
                label: "Field 2",
                type: "select",
                weight: 20,
                options: [
                  { value: "option1", label: "Option 1", weight: 5 },
                  { value: "option2", label: "Option 2", weight: 15 },
                ],
                dataSource: "options",
              },
            ],
          },
        ],
      }

      const result = validate(validConfig)
      expect(result).toBe("Hurrah! Your form layout config is valid.")
    })

    it("should detect duplicate section names", () => {
      const invalidConfig: Config = {
        ...mockConfig,
        sections: [
          mockConfig.sections[0]!,
          { ...mockConfig.sections[0]! }, // Duplicate section
        ],
      }

      const result = validate(invalidConfig)
      expect(result).toContain("Duplicate section names")
    })

    it("should detect duplicate item names", () => {
      const invalidConfig: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              mockConfig.sections[0]!.items![0]!,
              { ...mockConfig.sections[0]!.items![0]! }, // Duplicate item
            ],
          },
        ],
      }

      const result = validate(invalidConfig)
      expect(result).toContain("Duplicate item names")
    })

    it("should detect duplicate option values", () => {
      const invalidConfig: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              {
                ...mockConfig.sections[0]!.items![1]!,
                options: [
                  { value: "option1", label: "Option 1" },
                  { value: "option1", label: "Option 2" }, // Duplicate value
                ],
              },
            ],
          },
        ],
      }

      const result = validate(invalidConfig)
      expect(result).toContain("The following names are used more than once")
    })
  })

  describe("prepare", () => {
    it("should prepare config with form state", () => {
      const formState = {
        field1: "test value",
        field2: "option1",
        field3: 15,
      }

      const result = prepare(formState, mockConfig)

      expect(result.sections?.[0]?.items?.[0]).toEqual({
        name: "field1",
        entry: "test value",
      })
      expect(result.sections?.[0]?.items?.[1]).toEqual({
        name: "field2",
        entry: "option1",
      })
      expect(result.sections?.[0]?.items?.[2]).toEqual({
        name: "field3",
        entry: 15,
      })
    })

    it("should skip empty values", () => {
      const formState = {
        field1: "test value",
        field2: "", // Empty value
        field3: 15,
      }

      const result = prepare(formState, mockConfig)

      expect(result.sections?.[0]?.items?.[1]).toEqual({
        name: "field2",
      })
    })

    it("should preserve comments and media", () => {
      const configWithExtras: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0]!,
            items: [
              {
                ...mockConfig.sections[0]!.items![0]!,
                comment: "Test comment",
                media: [{ type: "image", url: "test.jpg" }],
              },
            ],
          },
        ],
      }

      const formState = { field1: "test" }
      const result = prepare(formState, configWithExtras)

      expect(result.sections?.[0]?.items?.[0]).toEqual({
        name: "field1",
        entry: "test",
        comment: "Test comment",
        media: [{ type: "image", url: "test.jpg" }],
      })
    })
  })

  describe("unprepare", () => {
    it("should convert prepared config back to form state", () => {
      const preparedConfig: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0],
            items: [
              { name: "field1", entry: "test value", type: "text" as const },
              { name: "field2", entry: "option1", type: "select" as const },
              { name: "field3", entry: 15, type: "number" as const },
            ],
          },
        ],
      }

      const result = unprepare(preparedConfig)

      expect(result).toEqual({
        field1: "test value",
        field2: "option1",
        field3: 15,
      })
    })

    it("should skip empty entries", () => {
      const preparedConfig: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0],
            items: [
              { name: "field1", entry: "test value", type: "text" },
              { name: "field2", entry: "", type: "select" }, // Empty entry
            ],
          },
        ],
      }

      const result = unprepare(preparedConfig)

      expect(result).toEqual({
        field1: "test value",
      })
    })

    it("should handle sub-items", () => {
      const preparedConfig: Config = {
        ...mockConfig,
        sections: [
          {
            ...mockConfig.sections[0],
            items: [
              {
                name: "parentItem",
                type: "group" as const,
                entry: "parent value",
                subItems: [
                  {
                    name: "subItem1",
                    entry: "sub value 1",
                    type: "text" as const,
                  },
                  { name: "subItem2", entry: "", type: "text" as const }, // Empty sub item
                ],
              },
            ],
          },
        ],
      }

      const result = unprepare(preparedConfig)

      expect(result).toEqual({
        parentItem: "parent value",
        subItem1: "sub value 1",
      })
    })

    it("should handle subsections convert config back to form state", () => {
      const configWithSubsections: Config = {
        name: "testFormWithSubsections",
        label: "Test Form With Subsections",
        sections: [
          {
            name: "mainSection",
            label: "Main Section",
            items: [{ name: "mainField", type: "text" }],
            subSections: [
              {
                name: "subSection1",
                label: "Sub Section 1",
                items: [
                  { name: "subField1", type: "number" },
                  { name: "subField2", type: "text" },
                ],
              },
            ],
          },
        ],
      }

      const formState = {
        mainField: "main value",
        subField1: 42,
        subField2: "sub value",
      }

      // Prepare config with formState
      const prepared = prepare(formState, configWithSubsections)
      // Unprepare to get formState back
      const formStateUnprepared = unprepare(prepared)

      expect(prepared.sections[0].items?.[0]).toEqual({
        name: "mainField",
        entry: "main value",
      })
      expect(prepared.sections[0].subSections?.[0].items?.[0]).toEqual({
        name: "subField1",
        entry: 42,
      })
      expect(prepared.sections[0].subSections?.[0].items?.[1]).toEqual({
        name: "subField2",
        entry: "sub value",
      })
      expect(formStateUnprepared).toEqual(formState)
    })
  })

  describe("translate", () => {
    it("should translate labels using provided function", () => {
      const translationMap = {
        testForm: "Formulaire de Test",
        section1: "Section 1",
        field1: "Champ 1",
        field2: "Champ 2",
        field3: "Champ 3",
      }

      const t = (key: string) =>
        translationMap[key as keyof typeof translationMap] || key
      const result = translate(mockConfig, t)

      expect(result.label).toBe("Formulaire de Test")
      expect(result.sections?.[0]?.label).toBe("Section 1")
      expect(result.sections?.[0]?.items?.[0]?.label).toBe("Champ 1")
      expect(result.sections?.[0]?.items?.[1]?.label).toBe("Champ 2")
      expect(result.sections?.[0]?.items?.[2]?.label).toBe("Champ 3")
    })
  })

  describe("stringify", () => {
    it("should stringify config with default depth", () => {
      const result = stringify(mockConfig)
      expect(result).toBe(JSON.stringify(mockConfig))
    })

    it("should double stringify with depth 2", () => {
      const result = stringify(mockConfig, 2)
      expect(result).toBe(JSON.stringify(JSON.stringify(mockConfig)))
    })
  })

  describe("getChangeGroup", () => {
    it("should add string value to group", () => {
      const group = {}
      const setGroup = jest.fn()
      const item = { name: "testField", type: "group" as const }

      const changeGroup = getChangeGroup({ item, group, setGroup })
      changeGroup("value1")

      expect(setGroup).toHaveBeenCalledWith({
        testField: ["value1"],
      })
    })

    it("should remove existing string value from group", () => {
      const group = { testField: ["value1", "value2"] }
      const setGroup = jest.fn()
      const item = { name: "testField", type: "group" as const }

      const changeGroup = getChangeGroup({ item, group, setGroup })
      changeGroup("value1")

      expect(setGroup).toHaveBeenCalledWith({
        testField: ["value2"],
      })
    })

    it("should add object value to group", () => {
      const group = {}
      const setGroup = jest.fn()
      const item = { name: "testField", type: "group" as const }
      const objectValue = { id: 1, name: "test" }

      const changeGroup = getChangeGroup({ item, group, setGroup })
      changeGroup(objectValue)

      expect(setGroup).toHaveBeenCalledWith({
        testField: [objectValue],
      })
    })

    it("should remove existing object value from group", () => {
      const objectValue = { id: 1, name: "test" }
      const group: Record<string, (Entry | object)[]> = {
        testField: [objectValue, { id: 2, name: "test2" }],
      }
      const setGroup = jest.fn()
      const item = { name: "testField", type: "group" as const }

      const changeGroup = getChangeGroup({ item, group, setGroup })
      changeGroup(objectValue)

      expect(setGroup).toHaveBeenCalledWith({
        testField: [{ id: 2, name: "test2" }],
      })
    })
  })

  describe("checkCondition", () => {
    const formState = { field1: "test", field2: "", field3: 10 }

    it("should handle AND conditions correctly", () => {
      const condition: Condition = {
        and: [
          { field: "field1", operator: "NOT_EMPTY" },
          { field: "field2", operator: "EMPTY" },
        ],
      }

      expect(checkCondition(condition, formState)).toBe(true)

      const falseCondition: Condition = {
        and: [
          { field: "field1", operator: "NOT_EMPTY" },
          { field: "field2", operator: "NOT_EMPTY" },
        ],
      }

      expect(checkCondition(falseCondition, formState)).toBe(false)
    })

    it("should handle OR conditions correctly", () => {
      const condition: Condition = {
        or: [
          { field: "field1", operator: "EQUAL", value: "wrong" },
          { field: "field2", operator: "EMPTY" },
        ],
      }

      expect(checkCondition(condition, formState)).toBe(true)

      const falseCondition: Condition = {
        or: [
          { field: "field1", operator: "EQUAL", value: "wrong" },
          { field: "field2", operator: "NOT_EMPTY" },
        ],
      }

      expect(checkCondition(falseCondition, formState)).toBe(false)
    })

    it("should return false for unknown operators", () => {
      const condition: Condition = {
        field: "field1",
        operator: "UNKNOWN" as ConditionOperator,
        value: "test",
      }

      expect(checkCondition(condition, formState)).toBe(false)
    })

    it("should return false for malformed conditions", () => {
      const condition: Condition = {
        field: "field1",
        // Missing operator
      }

      expect(checkCondition(condition, formState)).toBe(false)
    })
  })
})
