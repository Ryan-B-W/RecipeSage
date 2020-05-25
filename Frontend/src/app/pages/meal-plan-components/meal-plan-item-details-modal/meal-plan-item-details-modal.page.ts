import { Input, Component } from '@angular/core';
import { NavController, ModalController, AlertController, ToastController } from '@ionic/angular';
import { MealPlanService } from '@/services/meal-plan.service';
import { LoadingService } from '@/services/loading.service';
import { UtilService, RouteMap } from '@/services/util.service';

import { NewMealPlanItemModalPage } from '../new-meal-plan-item-modal/new-meal-plan-item-modal.page';

import dayjs, { Dayjs } from 'dayjs';

@Component({
  selector: 'page-meal-plan-item-details-modal',
  templateUrl: 'meal-plan-item-details-modal.page.html',
  styleUrls: ['meal-plan-item-details-modal.page.scss']
})
export class MealPlanItemDetailsModalPage {

  @Input() mealPlanId;
  @Input() mealItem;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public mealPlanService: MealPlanService,
    public loadingService: LoadingService,
    public utilService: UtilService,
    public toastCtrl: ToastController) {
  }

  openRecipe() {
    this.navCtrl.navigateForward(RouteMap.RecipePage.getPath(this.mealItem.recipe.id));
    this.close();
  }

  async edit() {
    const modal = await this.modalCtrl.create({
      component: NewMealPlanItemModalPage,
      componentProps: {
        isEditing: true,
        inputType: this.mealItem.recipe ? 'recipe' : 'manualEntry',
        title: this.mealItem.title,
        recipe: this.mealItem.recipe,
        scheduled: this.mealItem.scheduled,
        meal: this.mealItem.meal
      }
    });
    modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data || !data.item) return;
    const item = data.item;

    const loading = this.loadingService.start();

    const response = await this.mealPlanService.updateMealPlanItems(this.mealPlanId, [{
      id: this.mealItem.id,
      title: item.title,
      recipeId: item.recipeId,
      scheduled: item.scheduled,
      meal: item.meal
    }]);

    loading.dismiss();

    if (response) {
      this.close({
        refresh: true,
        reference: response.reference
      });
    }
  }

  async clone() {
    const modal = await this.modalCtrl.create({
      component: NewMealPlanItemModalPage,
      componentProps: {
        isEditing: false,
        inputType: this.mealItem.recipe ? 'recipe' : 'manualEntry',
        title: this.mealItem.title,
        recipe: this.mealItem.recipe,
        scheduled: this.mealItem.scheduled,
        meal: this.mealItem.meal
      }
    });
    modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data || !data.item) return;
    const item = data.item;

    const loading = this.loadingService.start();

    const response = await this.mealPlanService.addMealPlanItems(this.mealPlanId, [{
      title: item.title,
      recipeId: item.recipeId,
      scheduled: item.scheduled,
      meal: item.meal
    }]);

    loading.dismiss();

    if (response) {
      this.close({
        refresh: true,
        reference: response.reference
      });
    }
  }

  async _addItem(item) {
    const loading = this.loadingService.start();

    try {
      const response = await this.mealPlanService.addItem({
        id: this.mealPlanId,
        title: item.title,
        recipeId: item.recipeId || null,
        meal: item.meal,
        scheduled: item.scheduled
      });

      this.close({
        refresh: true,
        reference: response.reference
      });
    } catch(err) {
      switch (err.response.status) {
        case 0:
          (await this.toastCtrl.create({
          message: this.utilService.standardMessages.offlinePushMessage,
          duration: 5000
        })).present();
        break;
        case 401:
          (await this.toastCtrl.create({
          message: this.utilService.standardMessages.unauthorized,
          duration: 6000
        })).present();
        break;
        default:
          (await this.toastCtrl.create({
          message: this.utilService.standardMessages.unexpectedError,
          duration: 6000
        })).present();
        break;
      }
    }

    loading.dismiss();
  }

  async delete() {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Removal',
      message: 'This will remove "' + (this.mealItem.recipe || this.mealItem).title + '" from this meal plan.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: () => {
            this._delete();
          }
        }
      ]
    });
    alert.present();
  }

  async _delete() {
    const loading = this.loadingService.start();

    const response = await this.mealPlanService.deleteMealPlanItems(this.mealPlanId, [this.mealItem.id])

    loading.dismiss();

    if (response) {
      this.close({
        refresh: true,
        reference: response.reference
      });
    }
  }

  formatDate(date) {
    return dayjs(date).format('YYYY-MM-DD');
  }

  close(args?) {
    this.modalCtrl.dismiss(args);
  }
}
