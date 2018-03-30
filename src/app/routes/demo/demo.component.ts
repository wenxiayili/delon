import { Component } from '@angular/core';
import { SFSchema } from '@delon/schema-form';

@Component({
    selector: 'app-demo',
    template: `
    <sf [schema]="schema" [model]="model">
        <button nz-button nzType="primary" [nzLoading]="loading">Submit</button>
    </sf>
    `
})
export class DemoComponent {
    loading = true;
    schema: SFSchema = {
        'title': 'Schema dependencies',
        'description': 'These samples are best viewed without live validation.',
        'type': 'object',
        'properties': {
          'simple': {
            // 'src': `https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies`,
            'title': 'Simple',
            'type': 'object',
            'properties': {
              'name': {
                'type': 'string'
              },
              'credit_card': {
                'type': 'number'
              }
            },
            'required': [
              'name'
            ],
            'dependencies': {
              'credit_card': {
                'properties': {
                  'billing_address': {
                    'type': 'string'
                  }
                },
                'required': [
                  'billing_address'
                ]
              }
            }
          },
          'conditional': {
            'title': 'Conditional',
            '$ref': '#/definitions/person'
          },
          'arrayOfConditionals': {
            'title': 'Array of conditionals',
            'type': 'array',
            'items': {
              '$ref': '#/definitions/person'
            }
          },
          'fixedArrayOfConditionals': {
            'title': 'Fixed array of conditionals',
            'type': 'array',
            'items': [
              {
                'title': 'Primary person',
                '$ref': '#/definitions/person'
              }
            ],
            'additionalItems': {
              'title': 'Additional person',
              '$ref': '#/definitions/person'
            }
          }
        },
        'definitions': {
          'person': {
            'title': 'Person',
            'type': 'object',
            'properties': {
              'Do you have any pets?': {
                'type': 'string',
                'enum': [
                  'No',
                  'Yes: One',
                  'Yes: More than one'
                ],
                'default': 'No'
              }
            },
            'required': [
              'Do you have any pets?'
            ],
            'dependencies': {
              'Do you have any pets?': {
                'oneOf': [
                  {
                    'properties': {
                      'Do you have any pets?': {
                        'enum': [
                          'No'
                        ]
                      }
                    }
                  },
                  {
                    'properties': {
                      'Do you have any pets?': {
                        'enum': [
                          'Yes: One'
                        ]
                      },
                      'How old is your pet?': {
                        'type': 'number'
                      }
                    },
                    'required': [
                      'How old is your pet?'
                    ]
                  },
                  {
                    'properties': {
                      'Do you have any pets?': {
                        'enum': [
                          'Yes: More than one'
                        ]
                      },
                      'Do you want to get rid of any?': {
                        'type': 'boolean'
                      }
                    },
                    'required': [
                      'Do you want to get rid of any?'
                    ]
                  }
                ]
              }
            }
          }
        }
      };
    model = {
        'title': 'My current tasks',
        'tasks': [
          {
            'details': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            'done': true
          },
          {
            'title': 'My second task',
            'details': 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
            'done': false
          }
        ]
    };
    constructor() {
        setTimeout(() => this.loading = false, 1000);
    }
}
