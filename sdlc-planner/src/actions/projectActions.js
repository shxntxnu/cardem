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
} from './types';
import { devConnectorTemplate, ecommerceTemplate, blankTemplate } from '../utils/templates';

// Load template by ID
export const loadTemplate = (templateId) => (dispatch) => {
  let template = devConnectorTemplate;
  if (templateId === 'ecommerce') template = ecommerceTemplate;
  if (templateId === 'blank') template = blankTemplate;

  dispatch({
    type: LOAD_TEMPLATE,
    payload: JSON.parse(JSON.stringify(template))
  });
};

// Update project metadata
export const updateMetadata = (metadata) => (dispatch) => {
  dispatch({
    type: UPDATE_PROJECT_METADATA,
    payload: metadata
  });
};

// Import custom JSON project
export const importProjectJSON = (projectData) => (dispatch) => {
  dispatch({
    type: IMPORT_PROJECT_JSON,
    payload: projectData
  });
};

// Extend existing project with new features/modules
export const extendProject = (enhancementData) => (dispatch) => {
  dispatch({
    type: EXTEND_PROJECT,
    payload: enhancementData
  });
};

// ERD Actions
export const addEntity = (entity) => (dispatch) => {
  dispatch({ type: ADD_ENTITY, payload: entity });
};

export const deleteEntity = (entityId) => (dispatch) => {
  dispatch({ type: DELETE_ENTITY, payload: entityId });
};

export const updateErdSyntax = (syntax) => (dispatch) => {
  dispatch({ type: UPDATE_ERD_SYNTAX, payload: syntax });
};

// Diagrams Actions
export const updateDiagramSyntax = (diagramKey, syntax) => (dispatch) => {
  dispatch({
    type: UPDATE_DIAGRAM_SYNTAX,
    payload: { diagramKey, syntax }
  });
};

// Story Actions
export const addStory = (story) => (dispatch) => {
  dispatch({ type: ADD_STORY, payload: story });
};

export const updateStory = (story) => (dispatch) => {
  dispatch({ type: UPDATE_STORY, payload: story });
};

export const deleteStory = (storyId) => (dispatch) => {
  dispatch({ type: DELETE_STORY, payload: storyId });
};

// Architecture Actions
export const addBusinessRule = (rule) => (dispatch) => {
  dispatch({ type: ADD_BUSINESS_RULE, payload: rule });
};

export const deleteBusinessRule = (ruleId) => (dispatch) => {
  dispatch({ type: DELETE_BUSINESS_RULE, payload: ruleId });
};

export const addApiEndpoint = (endpoint) => (dispatch) => {
  dispatch({ type: ADD_API_ENDPOINT, payload: endpoint });
};

export const deleteApiEndpoint = (endpointIndex) => (dispatch) => {
  dispatch({ type: DELETE_API_ENDPOINT, payload: endpointIndex });
};

// Roadmap Actions
export const addRoadmapItem = (item) => (dispatch) => {
  dispatch({ type: ADD_ROADMAP_ITEM, payload: item });
};

export const deleteRoadmapItem = (itemId) => (dispatch) => {
  dispatch({ type: DELETE_ROADMAP_ITEM, payload: itemId });
};
