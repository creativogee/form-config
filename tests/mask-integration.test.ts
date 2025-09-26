import { Config, decompose } from "../src/index"

// Mock the applyMask function from @crudmates/masq
jest.mock("@crudmates/masq", () => ({
  applyMask: jest.fn(),
}))

import { applyMask } from "@crudmates/masq"

const mockApplyMask = applyMask as jest.MockedFunction<typeof applyMask>

describe("Mask Integration", () => {
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
            entry: "test value",
          },
          {
            name: "field2",
            label: "Field 2",
            type: "select",
            weight: 20,
            entry: "option1",
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("applyMask integration in decompose", () => {
    it("should call applyMask when mask parameter is provided", () => {
      const mask = { sections: [{ items: [{ name: "field1" }] }] }
      const expectedResult = {
        sections: [
          {
            items: [{ name: "field1", entry: "masked value" }],
          },
        ],
      }

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask })

      expect(mockApplyMask).toHaveBeenCalledTimes(1)
      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, mask)
      expect(result).toEqual(expectedResult)
    })

    it("should not call applyMask when mask parameter is not provided", () => {
      const result = decompose(mockConfig)

      expect(mockApplyMask).not.toHaveBeenCalled()
      // Should use the default decompose logic
      expect(result.sections?.[0]?.items?.[0]).toEqual({
        name: "field1",
        entry: "test value",
      })
    })

    it("should not call applyMask when only allow parameter is provided", () => {
      const result = decompose(mockConfig, { allow: ["name", "entry"] })

      expect(mockApplyMask).not.toHaveBeenCalled()
      // Should use the allow logic
      expect(result.sections?.[0]?.items?.[0]).toEqual({
        name: "field1",
        entry: "test value",
      })
    })

    it("should handle applyMask returning empty result", () => {
      const mask = { sections: [] }
      const expectedResult = {}

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, mask)
      expect(result).toEqual(expectedResult)
    })

    it("should handle applyMask returning null", () => {
      const mask = { sections: [] }
      const expectedResult = null

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, mask)
      expect(result).toEqual(expectedResult)
    })

    it("should handle applyMask throwing an error", () => {
      const mask = { sections: [] }
      const error = new Error("Mask processing failed")

      mockApplyMask.mockImplementation(() => {
        throw error
      })

      expect(() => decompose(mockConfig, { mask })).toThrow(
        "Mask processing failed",
      )
      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, mask)
    })

    it("should pass through complex mask objects correctly", () => {
      const complexMask = {
        sections: [
          {
            items: [
              { name: "field1", entry: "value1" },
              { name: "field2", entry: "value2" },
            ],
          },
        ],
        metadata: { version: "1.0", processed: true },
        filters: { include: ["field1"], exclude: ["field2"] },
      }

      const expectedResult = {
        sections: [
          {
            items: [{ name: "field1", entry: "filtered value" }],
          },
        ],
      }

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask: complexMask })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, complexMask)
      expect(result).toEqual(expectedResult)
    })

    it("should handle mask parameter with nested structures", () => {
      const nestedMask = {
        sections: [
          {
            name: "section1",
            items: [{ name: "field1" }, { name: "field2" }],
            subSections: [
              {
                name: "subSection1",
                items: [{ name: "subField1" }],
              },
            ],
          },
        ],
      }

      const expectedResult = {
        sections: [
          {
            name: "section1",
            items: [{ name: "field1", entry: "nested value" }],
          },
        ],
      }

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask: nestedMask })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, nestedMask)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("Mask parameter validation", () => {
    it("should accept empty mask object", () => {
      const emptyMask = {}
      const expectedResult = {}

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask: emptyMask })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, emptyMask)
      expect(result).toEqual(expectedResult)
    })

    it("should accept mask with undefined values", () => {
      const maskWithUndefined = {
        sections: undefined,
        metadata: { version: "1.0" },
      }

      const expectedResult = { metadata: { version: "1.0" } }

      mockApplyMask.mockReturnValue(expectedResult)

      const result = decompose(mockConfig, { mask: maskWithUndefined })

      expect(mockApplyMask).toHaveBeenCalledWith(mockConfig, maskWithUndefined)
      expect(result).toEqual(expectedResult)
    })
  })
})
