import {
  SET_PROJECT,
  UPDATE_PROJECT_METADATA,
  LOAD_TEMPLATE,
  IMPORT_PROJECT_JSON,
  EXTEND_PROJECT,
  ADD_ENTITY,
  DELETE_ENTITY,
  UPDATE_ERD_SYNTAX,
  UPDATE_DIAGRAM_SYNTAX,
  ADD_STORY,
  UPDATE_STORY,
  DELETE_STORY,
  ADD_BUSINESS_RULE,
  DELETE_BUSINESS_RULE,
  ADD_API_ENDPOINT,
  DELETE_API_ENDPOINT,
  ADD_ROADMAP_ITEM,
  DELETE_ROADMAP_ITEM
} from '../actions/types';
import { devConnectorTemplate } from '../utils/templates';

const initialState = {
  currentProject: devConnectorTemplate,
  activeTab: 'overview',
  activeTemplateId: 'devconnector'
};

export default function projectReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case LOAD_TEMPLATE:
      return {
        ...state,
        currentProject: payload,
        activeTemplateId: payload.id
      };

    case IMPORT_PROJECT_JSON:
      return {
        ...state,
        currentProject: payload,
        activeTemplateId: 'custom'
      };

    case EXTEND_PROJECT: {
      const current = state.currentProject;
      const { businessRules, dataLayer, functionalLayer, erdEntities, stories, roadmap, erdMermaidDelta } = payload;
      
      const newBusiness = [...(current.architecture?.businessLayer || []), ...(businessRules || [])];
      const newData = [...(current.architecture?.dataLayer || []), ...(dataLayer || [])];
      const newFunctional = [...(current.architecture?.functionalLayer || []), ...(functionalLayer || [])];
      const newEntities = [...(current.erd?.entities || []), ...(erdEntities || [])];
      const newStories = [...(stories || []), ...(current.stories || [])];
      const newRoadmap = [...(current.roadmap || []), ...(roadmap || [])];

      let newMermaid = current.erd?.mermaidSyntax || 'erDiagram';
      if (erdMermaidDelta) {
        newMermaid += '\n' + erdMermaidDelta;
      } else if (erdEntities && erdEntities.length > 0) {
        erdEntities.forEach(e => {
          newMermaid += `\n    ${e.name} {\n        UUID id PK\n    }`;
        });
      }

      return {
        ...state,
        currentProject: {
          ...current,
          architecture: {
            ...current.architecture,
            businessLayer: newBusiness,
            dataLayer: newData,
            functionalLayer: newFunctional
          },
          erd: {
            ...current.erd,
            entities: newEntities,
            mermaidSyntax: newMermaid
          },
          stories: newStories,
          roadmap: newRoadmap
        }
      };
    }

    case UPDATE_PROJECT_METADATA:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          ...payload
        }
      };

    case ADD_ENTITY: {
      const updatedEntities = [...(state.currentProject.erd?.entities || []), payload];
      // Automatically append to Mermaid syntax if not already present
      const newSyntax = `${state.currentProject.erd?.mermaidSyntax || 'erDiagram'}\n    ${payload.name} {\n        ObjectId _id PK\n        Date created_at\n    }`;
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          erd: {
            ...state.currentProject.erd,
            entities: updatedEntities,
            mermaidSyntax: newSyntax
          }
        }
      };
    }

    case DELETE_ENTITY:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          erd: {
            ...state.currentProject.erd,
            entities: (state.currentProject.erd?.entities || []).filter(e => e.id !== payload)
          }
        }
      };

    case UPDATE_ERD_SYNTAX:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          erd: {
            ...state.currentProject.erd,
            mermaidSyntax: payload
          }
        }
      };

    case UPDATE_DIAGRAM_SYNTAX:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          diagrams: {
            ...state.currentProject.diagrams,
            [payload.diagramKey]: payload.syntax
          }
        }
      };

    case ADD_STORY:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          stories: [payload, ...(state.currentProject.stories || [])]
        }
      };

    case UPDATE_STORY:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          stories: (state.currentProject.stories || []).map(s => s.id === payload.id ? payload : s)
        }
      };

    case DELETE_STORY:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          stories: (state.currentProject.stories || []).filter(s => s.id !== payload)
        }
      };

    case ADD_BUSINESS_RULE:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          architecture: {
            ...state.currentProject.architecture,
            businessLayer: [...(state.currentProject.architecture?.businessLayer || []), payload]
          }
        }
      };

    case DELETE_BUSINESS_RULE:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          architecture: {
            ...state.currentProject.architecture,
            businessLayer: (state.currentProject.architecture?.businessLayer || []).filter(b => b.id !== payload)
          }
        }
      };

    case ADD_API_ENDPOINT:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          architecture: {
            ...state.currentProject.architecture,
            functionalLayer: [...(state.currentProject.architecture?.functionalLayer || []), payload]
          }
        }
      };

    case DELETE_API_ENDPOINT:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          architecture: {
            ...state.currentProject.architecture,
            functionalLayer: (state.currentProject.architecture?.functionalLayer || []).filter((_, idx) => idx !== payload)
          }
        }
      };

    case ADD_ROADMAP_ITEM:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          roadmap: [...(state.currentProject.roadmap || []), payload]
        }
      };

    case DELETE_ROADMAP_ITEM:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          roadmap: (state.currentProject.roadmap || []).filter(r => r.id !== payload)
        }
      };

    default:
      return state;
  }
}
