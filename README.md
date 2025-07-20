<h1 align="center">
  @crudmates/form-config
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@crudmates/form-config"><img alt="NPM version" src="https://img.shields.io/npm/v/@crudmates/form-config.svg"></a>
  <a href="https://www.npmjs.com/package/@crudmates/form-config"><img alt="NPM downloads" src="https://img.shields.io/npm/dw/@crudmates/form-config.svg"></a>
  <a href="https://github.com/creativogee/form-config/actions/workflows/ci.yml"><img alt="CI Status" src="https://github.com/creativogee/form-config/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Test Coverage" src="https://img.shields.io/badge/coverage-87%25-brightgreen">
  <a href="https://www.paypal.com/donate?hosted_button_id=Z9NGDEGSC3LPY" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"></a>
</p>

Say goodbye to complex form logic and hello to a streamlined, type-safe form configuration experience. `@crudmates/form-config` is your go-to library for building robust, dynamic forms with ease.

## 🚀 Features

- **🛠 Flexible Configuration**: Craft intricate form structures effortlessly using TypeScript interfaces.
- **✅ Built-in Validation**: Aside client-side validation using tools like Zod, `@crudmates/form-config` also provides built-in validation for your form configuration to ensure data integrity.
- **📊 Smart Evaluation**: Automatically calculate totals and ratios based on your form data.
- **🧩 Dynamic Decomposition**: Strip down your form configuration to the essentials before sending it to the server or storing it in the database. You can also reassemble the configuration later.
- **🔧 TypeScript-First**: Enjoy full TypeScript support for a superior developer experience and fewer runtime errors.
- **🚀 Seamless Integration**: Integrate with popular libraries like React Hook Form and Zod for a seamless development experience.

## 💪 Why Choose @crudmates/form-config?

1. **Full Ownership and Control of Data**: Unlike hosted solutions, maintain complete control over your form configurations and data.

2. **Portability and Flexibility**: Easily move your form configurations between projects, backends, or frontend frameworks.

3. **Integration with Custom Systems**: Seamlessly incorporate form building capabilities into existing applications or workflows.

4. **Version Control and Collaboration**: Store configurations in your project's source code, facilitating team collaboration and change history.

5. **Security and Privacy**: Keep sensitive form configurations on your own servers, crucial for meeting security and privacy requirements.

6. **Customization and Extension**: Extend functionality beyond out-of-the-box features with custom properties or domain-specific languages.

7. **Offline Capability**: Implement offline form building and editing capabilities.

8. **Cost-Effective for Large-Scale Use**: More economical for applications generating numerous forms or surveys compared to hosted solutions.

## 🏁 Quick Start

### Installation

Get started in seconds:

```sh
npm install @crudmates/form-config
```

## 🌟 Basic Usage

Explore real-world examples of `@crudmates/form-config` in action at [this repository](https://github.com/creativogee/form-config-demo). You can also create your own form configuration and see how it works 🎉

```typescript
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Config, Item, evaluate, stage, prepare } from '@crudmates/form-config';

// Define your form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  country: z.string().min(1, 'Country is required'),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

// Define your form configuration
const formConfig: Config = {
  name: 'registrationForm',
  label: 'Registration Form',
  sections: [
    {
      name: 'personalInfo',
      label: 'Personal Information',
      items: [
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          validation: {
            required: true,
          },
        },
        {
          label: 'Email',
          name: 'email',
          type: 'email',
          validation: {
            required: true,
          },
        },
        {
          label: 'Age',
          name: 'age',
          type: 'number',
          validation: {
            required: true,
            min: 18,
          },
        },
        {
          label: 'Country',
          name: 'country',
          type: 'select',
          options: [
            { label: 'United States', value: 'us' },
            { label: 'United Kingdom', value: 'uk' },
            { label: 'Canada', value: 'ca' },
          ],
          validation: {
            required: true,
          },
        },
        {
          label: 'I accept the terms and conditions',
          name: 'terms',
          type: 'checkbox',
          validation: {
            required: true,
          },
        },
        {
          label: 'Submit',
          name: 'submit',
          type: 'button',
        }
      ],
    },
  ],
};

// Component for rendering form inputs
const FormInput: React.FC<{ field: any; item: Item; error: any }> = ({ field, item, error }) => {
  switch (item.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'checkbox':
      return (
        <div>
          <label htmlFor={item.name}>{item.label}</label>
          <input {...field} id={item.name} type={item.type} />
          {error && <span>{error.message}</span>}
        </div>
      );
    case 'select':
      return (
        <div>
          <label htmlFor={item.name}>{item.label}</label>
          <select {...field} id={item.name}>
            <option value=''>Select a country</option>
            {item.options?.map((option) => (
              <option key={option.name} value={option.name}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <span>{error.message}</span>}
        </div>
      );
    case: 'button':
      return (
        <button type={item?.type as any}>
          {item.label}
        </button>
      )
    default:
      return <></>;
  }
};

// Main form component
const Form: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: stage(formConfig),
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: any) => {
    const preparedData = prepare(data, formConfig);
    // send data to server
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>{formConfig.sections[0].label}</h1>
      {formConfig.sections[0].items.map((item) => (
        <Controller
          key={item.name}
          name={item.name}
          control={control}
          rules={item.validation}
          render={({ field }) => <FormInput field={field} item={item} error={errors[item.name]} />}
        />
      ))}
    </form>
  );
};

export default Form;
```

## 📚 API Reference

### Core Functions

- `evaluate(config: Config, factor?: number): Config`
- `validate(config: Config): string`
- `compose(config: Config, sections: Partial<Section>[]): Config`
- `decompose(config: Config, options: DecomposeOptions): Partial<Config>`
- `stage(config: Config, sectionItem: Record<string, any>): Config`
- `evaluateCondition(condition?: Condition, formState?: Record<string, any>): boolean`
- `prepare(formState: Record<string, any>, config: Config): Config`
- `getChangeGroup(changeGroupOptions: ChangeGroupOptions, value: string): void`

## 🔗 Ecosystem and Related Packages

`@crudmates/form-config` is framework-agnostic and can be used with any frontend library or framework. Here are some related packages that you may find useful:

- **React**: A JavaScript library for building user interfaces. Use React to create dynamic, interactive forms with ease. [Learn more](https://reactjs.org/).

- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs. Use Tailwind CSS to style your forms and components. [Learn more](https://tailwindcss.com/).

- **React Hook Form**: A library for managing form state in React applications. @crudmates/form-config is designed to work seamlessly with React Hook Form. [Learn more](https://react-hook-form.com/).

- **Zod**: A TypeScript-first schema declaration and validation library. Use Zod to define your form schema and validate your form data. [Learn more](https://github.com/colinhacks/zod)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 💖 Support the Project

Love this package? Show your support by giving us a ⭐ on GitHub! Feeling extra generous? You can [buy us coffee](https://www.paypal.com/donate?hosted_button_id=Z9NGDEGSC3LPY) to keep us fueled for more coding adventures!☕️

