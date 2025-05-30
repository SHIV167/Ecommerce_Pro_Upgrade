import { Router } from 'express';
import * as ctrl from '../controllers/promoMessageController';

const router = Router();
router.get('/',      ctrl.getPromoMessages);
router.get('/:id',   ctrl.getPromoMessage);
router.post('/',     ctrl.createPromoMessage);
router.patch('/:id', ctrl.updatePromoMessage);
router.delete('/:id',ctrl.deletePromoMessage);

export default router;
