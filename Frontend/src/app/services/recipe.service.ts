import { AlertController } from '@ionic/angular';
import { Injectable } from '@angular/core';

import { Label } from './label.service';

import { HttpService } from './http.service';
import { HttpErrorHandlerService, ErrorHandlers } from './http-error-handler.service';
import { UtilService } from './util.service';
import { EventService } from './event.service';
import { Image } from './image.service';

import { parseIngredients, parseInstructions, parseNotes } from '../../../../SharedUtils/src';

export type RecipeFolderName = 'main' | 'inbox';

export interface BaseRecipe {
  title: string;
  description: string;
  yield: string;
  activeTime: string;
  totalTime: string;
  source: string;
  url: string;
  notes: string;
  ingredients: string;
  instructions: string;
  rating: number;
}

export interface Recipe extends BaseRecipe {
  id: string;
  labels: Label[];
  images: Image[];
  image: Image;
  fromUser?: any;
  fromUserId: string | null;
  folder: RecipeFolderName;
  isOwner?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface ParsedIngredient {
  content: string;
  originalContent: string;
  isHeader: boolean;
  complete: boolean;
}

export interface ParsedInstruction {
  content: string;
  isHeader: boolean;
  complete: boolean;
  count: number;
}

export interface ParsedNote {
  content: string;
  isHeader: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  constructor(
  public alertCtrl: AlertController,
  public events: EventService,
  public httpService: HttpService,
  private httpErrorHandlerService: HttpErrorHandlerService,
  public utilService: UtilService) {}

  getExportURL(format: string) {
    return `${this.utilService.getBase()}data/export/${format}${this.utilService.getTokenQuery()}&download=true`;
  }

  count(params: {
    folder?: string,
  }, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<{ count: number }>(
      `recipes/count`,
      'GET',
      null,
      params,
      errorHandlers
    );
  }

  fetch(params: {
    folder?: RecipeFolderName,
    userId?: string,
    sort?: string,
    offset?: number,
    count?: number,
    labels?: string,
    labelIntersection?: boolean,
    ratingFilter?: string,
  }, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<{
      data: Recipe[],
      totalCount: number
    }>(
      `recipes/by-page`,
      'GET',
      null,
      params,
      errorHandlers
    );
  }

  search(params: {
    query: string
    userId?: string,
    labels?: string,
    rating?: number,
    ratingFilter?: string,
  }, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<{
      data: Recipe[]
    }>(
      `recipes/search`,
      'GET',
      null,
      params,
      errorHandlers
    );
  }

  fetchById(recipeId: string, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<Recipe>(
      `recipes/${recipeId}`,
      'GET',
      null,
      null,
      errorHandlers
    );
  }

  getRecipeById(recipeId: string, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<Recipe>(
      `recipes/${recipeId}`,
      'GET',
      null,
      null,
      errorHandlers
    );
  }

  async create(payload: Partial<BaseRecipe> & {
    title: string,
    labels?: string[],
    imageIds?: string[]
  }, errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<Recipe>(
      `recipes`,
      'POST',
      payload,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async update(payload: Partial<BaseRecipe> & {
    id: string,
  }, errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<Recipe>(
      `recipes/${payload.id}`,
      'PUT',
      payload,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async deleteByLabelIds(payload: {
    labelIds: string[],
  }, errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<void>(
      `recipes/delete-by-labelIds`,
      'POST',
      payload,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async deleteBulk(payload: {
    recipeIds: string[],
  }, errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<void>(
      `recipes/delete-bulk`,
      'POST',
      payload,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async delete(recipeId: string, errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<void>(
      `recipes/${recipeId}`,
      'DELETE',
      null,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async deleteAll(errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<void>(
      `recipes/all`,
      'DELETE',
      null,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  async reindex(errorHandlers?: ErrorHandlers) {
    const response = await this.httpService.requestWithWrapper<void>(
      `recipes/reindex`,
      'POST',
      null,
      null,
      errorHandlers
    );

    this.events.publish('recipe:update');

    return response;
  }

  clipFromUrl(params: {
    url: string,
  }, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<any>(
      `clip`,
      'GET',
      null,
      params,
      errorHandlers
    );
  }

  print(recipe, template) {
    window.open(this.utilService.getBase() + 'print/' + this.utilService.getTokenQuery()
                + '&recipeId=' + recipe.id + '&template=' + template.name + '&modifiers=' + template.modifiers + '&print=true');
  }

  scrapePepperplate(params: {
    username: string,
    password: string,
  }, errorHandlers?: ErrorHandlers) {
    return this.httpService.requestWithWrapper<Recipe>(
      `scrape/pepperplate`,
      'GET',
      null,
      params,
      errorHandlers
    );
  }

  importFDXZ(fdxzFile, payload: {
    excludeImages?: boolean,
  }, errorHandlers?: ErrorHandlers) {
    const formData: FormData = new FormData();
    formData.append('fdxzdb', fdxzFile, fdxzFile.name);

    return this.httpService.multipartRequestWithWrapper<void>(
      'import/fdxz',
      'POST',
      formData,
      payload,
      errorHandlers
    );
  }

  importLCB(lcbFile, payload: {
    includeStockRecipes?: boolean,
    includeTechniques?: boolean,
    excludeImages?: boolean,
  }, errorHandlers?: ErrorHandlers) {
    const formData: FormData = new FormData();
    formData.append('lcbdb', lcbFile, lcbFile.name);

    return this.httpService.multipartRequestWithWrapper<void>(
      'import/livingcookbook',
      'POST',
      formData,
      payload,
      errorHandlers
    );
  }

  importPaprika(paprikaFile, errorHandlers?: ErrorHandlers) {
    const formData: FormData = new FormData();
    formData.append('paprikadb', paprikaFile, paprikaFile.name);

    return this.httpService.multipartRequestWithWrapper<void>(
      'data/import/paprika',
      'POST',
      formData,
      null,
      errorHandlers
    );
  }

  importJSONLD(jsonLDFile, errorHandlers?: ErrorHandlers) {
    const formData: FormData = new FormData();
    formData.append('jsonLD', jsonLDFile, jsonLDFile.name);

    return this.httpService.multipartRequestWithWrapper<void>(
      'data/import/json-ld',
      'POST',
      formData,
      null,
      errorHandlers
    );
  }

  parseIngredients(ingredients: string, scale: number, boldify?: boolean): ParsedIngredient[] {
    return parseIngredients(ingredients, scale, boldify);
  }

  parseInstructions(instructions: string): ParsedInstruction[] {
    return parseInstructions(instructions);
  }

  parseNotes(notes: string): ParsedNote[] {
    return parseNotes(notes);
  }
}
