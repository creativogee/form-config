import {
  Config,
  Section,
  Item,
  Option,
  Validation,
  Condition,
  Entry,
  ItemType,
  MediaType,
  ConditionOperator,
  DataSource,
  Media,
  Tier,
  DecomposeOptions,
  ChangeGroupOptions,
  ComposeOptions,
} from "../src/types/index"

describe("Type Definitions", () => {
  describe("Basic Types", () => {
    it("should allow valid Entry types", () => {
      const stringEntry: Entry = "test string"
      const numberEntry: Entry = 42
      const arrayEntry: Entry = ["item1", "item2"]

      expect(typeof stringEntry).toBe("string")
      expect(typeof numberEntry).toBe("number")
      expect(Array.isArray(arrayEntry)).toBe(true)
    })

    it("should allow valid ItemType values", () => {
      const textType: ItemType = "text"
      const numberType: ItemType = "number"
      const selectType: ItemType = "select"
      const groupType: ItemType = "group"

      expect(textType).toBe("text")
      expect(numberType).toBe("number")
      expect(selectType).toBe("select")
      expect(groupType).toBe("group")
    })

    it("should allow valid MediaType values", () => {
      const imageType: MediaType = "image"
      const videoType: MediaType = "video"
      const audioType: MediaType = "audio"

      expect(imageType).toBe("image")
      expect(videoType).toBe("video")
      expect(audioType).toBe("audio")
    })

    it("should allow valid ConditionOperator values", () => {
      const equalOp: ConditionOperator = "EQUAL"
      const notEqualOp: ConditionOperator = "NOT_EQUAL"
      const emptyOp: ConditionOperator = "EMPTY"
      const notEmptyOp: ConditionOperator = "NOT_EMPTY"

      expect(equalOp).toBe("EQUAL")
      expect(notEqualOp).toBe("NOT_EQUAL")
      expect(emptyOp).toBe("EMPTY")
      expect(notEmptyOp).toBe("NOT_EMPTY")
    })

    it("should allow valid DataSource values", () => {
      const optionsSource: DataSource = "options"
      const urlSource: DataSource = "url"
      const arbitrarySource: DataSource = "arbitrary"

      expect(optionsSource).toBe("options")
      expect(urlSource).toBe("url")
      expect(arbitrarySource).toBe("arbitrary")
    })
  })

  describe("Interface Structures", () => {
    it("should create valid Validation interface", () => {
      const validation: Validation = {
        required: true,
        minLength: 5,
        maxLength: 100,
        min: 0,
        max: 10,
        pattern: "^[a-zA-Z]+$",
        allowedValues: ["option1", "option2"],
        accept: ".jpg,.png",
      }

      expect(validation.required).toBe(true)
      expect(validation.minLength).toBe(5)
      expect(validation.maxLength).toBe(100)
      expect(validation.min).toBe(0)
      expect(validation.max).toBe(10)
      expect(validation.pattern).toBe("^[a-zA-Z]+$")
      expect(validation.allowedValues).toEqual(["option1", "option2"])
      expect(validation.accept).toBe(".jpg,.png")
    })

    it("should create valid Option interface", () => {
      const option: Option = {
        id: "opt1",
        value: "option1",
        label: "Option 1",
        weight: 10,
        upvote: true,
        downvote: false,
        novote: false,
      }

      expect(option.id).toBe("opt1")
      expect(option.value).toBe("option1")
      expect(option.label).toBe("Option 1")
      expect(option.weight).toBe(10)
      expect(option.upvote).toBe(true)
      expect(option.downvote).toBe(false)
      expect(option.novote).toBe(false)
    })

    it("should create valid Tier interface", () => {
      const tier: Tier = {
        maxValue: "100",
        rate: 0.8,
      }

      expect(tier.maxValue).toBe("100")
      expect(tier.rate).toBe(0.8)
    })

    it("should create valid Media interface", () => {
      const media: Media = {
        name: "Test Image",
        type: "image",
        url: "https://example.com/image.jpg",
      }

      expect(media.name).toBe("Test Image")
      expect(media.type).toBe("image")
      expect(media.url).toBe("https://example.com/image.jpg")
    })

    it("should create valid Condition interface", () => {
      const simpleCondition: Condition = {
        field: "testField",
        operator: "EQUAL",
        value: "testValue",
      }

      const complexCondition: Condition = {
        and: [
          { field: "field1", operator: "NOT_EMPTY" },
          { field: "field2", operator: "EQUAL", value: "value" },
        ],
        or: [
          { field: "field3", operator: "EMPTY" },
          { field: "field4", operator: "NOT_EQUAL", value: "other" },
        ],
      }

      expect(simpleCondition.field).toBe("testField")
      expect(simpleCondition.operator).toBe("EQUAL")
      expect(simpleCondition.value).toBe("testValue")

      expect(complexCondition.and).toHaveLength(2)
      expect(complexCondition.or).toHaveLength(2)
    })

    it("should create valid Item interface", () => {
      const item: Item = {
        name: "testItem",
        type: "text",
        label: "Test Item",
        entry: "test value",
        comment: "Test comment",
        media: [{ type: "image", url: "test.jpg" }],
        tabIndex: 1,
        value: "display value",
        description: "Test description",
        devNote: "Developer note",
        placeholder: "Enter text here",
        subType: "email",
        weight: 10,
        tiers: [{ maxValue: "100", rate: 1.0 }],
        default: "default value",
        style: "color: blue;",
        disabled: false,
        hidden: false,
        conditions: {
          enable: { field: "enableField", operator: "NOT_EMPTY" },
          show: { field: "showField", operator: "EQUAL", value: "show" },
        },
        dataSource: "options",
        url: "https://api.example.com/data",
        template: "custom-template",
        validation: { required: true, min: 1 },
        options: [{ value: "opt1", label: "Option 1" }],
        subItems: [],
      }

      expect(item.name).toBe("testItem")
      expect(item.type).toBe("text")
      expect(item.label).toBe("Test Item")
      expect(item.entry).toBe("test value")
      expect(item.weight).toBe(10)
      expect(item.validation?.required).toBe(true)
      expect(item.options).toHaveLength(1)
    })

    it("should create valid Section interface", () => {
      const section: Section = {
        name: "testSection",
        label: "Test Section",
        weight: 50,
        total: 25,
        ratio: 0.5,
        comment: "Section comment",
        style: "background: #f0f0f0;",
        items: [
          {
            name: "item1",
            type: "text",
            label: "Item 1",
          },
        ],
        subSections: [],
      }

      expect(section.name).toBe("testSection")
      expect(section.label).toBe("Test Section")
      expect(section.weight).toBe(50)
      expect(section.total).toBe(25)
      expect(section.ratio).toBe(0.5)
      expect(section.items).toHaveLength(1)
    })

    it("should create valid Config interface", () => {
      const config: Config = {
        name: "testConfig",
        label: "Test Configuration",
        weight: 100,
        total: 80,
        ratio: 0.8,
        comment: "Config comment",
        sections: [
          {
            name: "section1",
            label: "Section 1",
            items: [
              {
                name: "item1",
                type: "text",
                label: "Item 1",
              },
            ],
          },
        ],
      }

      expect(config.name).toBe("testConfig")
      expect(config.label).toBe("Test Configuration")
      expect(config.weight).toBe(100)
      expect(config.sections).toHaveLength(1)
    })
  })

  describe("Options Interfaces", () => {
    it("should create valid DecomposeOptions interface", () => {
      const options: DecomposeOptions = {
        allow: ["name", "entry", "value"],
      }

      expect(options.allow).toEqual(["name", "entry", "value"])
    })

    it("should create valid ComposeOptions interface", () => {
      const options: ComposeOptions = {
        validate: true,
        strict: false,
      }

      expect(options.validate).toBe(true)
      expect(options.strict).toBe(false)
    })

    it("should create valid ChangeGroupOptions interface", () => {
      const mockSetGroup = jest.fn()
      const options: ChangeGroupOptions = {
        item: {
          name: "groupItem",
          type: "group",
        },
        group: {
          groupItem: ["value1", "value2"],
        },
        setGroup: mockSetGroup,
      }

      expect(options.item.name).toBe("groupItem")
      expect(options.item.type).toBe("group")
      expect(options.group.groupItem).toEqual(["value1", "value2"])
      expect(typeof options.setGroup).toBe("function")
    })
  })

  describe("Type Compatibility", () => {
    it("should handle generic Section types", () => {
      const partialSection: Section<Partial<Item>> = {
        name: "partialSection",
        items: [
          {
            name: "partialItem",
            // Other fields are optional in Partial<Item>
          },
        ],
      }

      expect(partialSection.name).toBe("partialSection")
      expect(partialSection.items?.[0].name).toBe("partialItem")
    })

    it("should handle generic Config types", () => {
      const partialConfig: Config<Section<Partial<Item>>> = {
        name: "partialConfig",
        label: "Partial Config",
        sections: [
          {
            name: "section1",
            items: [
              {
                name: "item1",
                entry: "test",
              },
            ],
          },
        ],
      }

      expect(partialConfig.name).toBe("partialConfig")
      expect(partialConfig.sections[0].items?.[0].name).toBe("item1")
    })
  })

  describe("Optional Fields", () => {
    it("should allow minimal Item creation", () => {
      const minimalItem: Item = {
        name: "minimal",
        type: "text",
      }

      expect(minimalItem.name).toBe("minimal")
      expect(minimalItem.type).toBe("text")
      expect(minimalItem.label).toBeUndefined()
      expect(minimalItem.validation).toBeUndefined()
    })

    it("should allow minimal Section creation", () => {
      const minimalSection: Section = {
        name: "minimal",
      }

      expect(minimalSection.name).toBe("minimal")
      expect(minimalSection.label).toBeUndefined()
      expect(minimalSection.items).toBeUndefined()
    })

    it("should allow minimal Config creation", () => {
      const minimalConfig: Config = {
        name: "minimal",
        label: "Minimal Config",
        sections: [],
      }

      expect(minimalConfig.name).toBe("minimal")
      expect(minimalConfig.label).toBe("Minimal Config")
      expect(minimalConfig.sections).toEqual([])
      expect(minimalConfig.weight).toBeUndefined()
    })

    it("should allow minimal Option creation", () => {
      const minimalOption: Option = {
        value: "value",
        label: "Label",
      }

      expect(minimalOption.value).toBe("value")
      expect(minimalOption.label).toBe("Label")
      expect(minimalOption.weight).toBeUndefined()
      expect(minimalOption.id).toBeUndefined()
    })
  })
})
