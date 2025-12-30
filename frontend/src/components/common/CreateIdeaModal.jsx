/**
 * CreateIdeaModal Component - مودال ایجاد ایده جدید (Enhanced)
 * شامل فیلدهای پیشرفته: بودجه، مراحل اجرا، تخصص‌ها
 */

import { useState } from 'react';
import ideaService from '../../services/ideaService';
import Button from './Button';
import Input from './Input';
import IdeaBlocks from './IdeaBlocks';
import { useToast } from '../../contexts/ToastContext';
import './Modal.css';
import './CreateIdeaModal.css';

function CreateIdeaModal({ onClose, onCreate }) {
    const toast = useToast();
    const [step, setStep] = useState(1); // 1: Basic, 2: Details
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public',
        budget: '',
        execution_steps: '',
        required_skills: '',
    });
    const [customFields, setCustomFields] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'عنوان ایده الزامی است';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'توضیحات ایده الزامی است';
        } else if (formData.description.length < 20) {
            newErrors.description = 'توضیحات باید حداقل ۲۰ کاراکتر باشد';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Only submit on step 2
        if (step !== 2) return;
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                blocks: blocks,
                custom_fields: customFields.filter(f => f.name && f.value),
            };
            const newIdea = await ideaService.createIdea(payload);
            if (onCreate) onCreate(newIdea);
            toast.success('ایده جدید با موفقیت ایجاد شد 🎉');
        } catch (error) {
            console.error('Error creating idea:', error);
            const data = error.response?.data;
            if (data?.error) {
                toast.error(data.error);
            } else if (data && typeof data === 'object') {
                const fieldErrors = {};
                Object.keys(data).forEach(key => {
                    fieldErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
                });
                setErrors(fieldErrors);
                toast.error('لطفا خطاها را برطرف کنید');
            } else {
                toast.error('خطا در ایجاد ایده');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const addCustomField = () => {
        if (customFields.length >= 3) {
            toast.warning('حداکثر ۳ فیلد سفارشی مجاز است');
            return;
        }
        setCustomFields([...customFields, {
            name: '',
            field_type: 'text',
            value: ''
        }]);
    };

    const updateCustomField = (index, key, value) => {
        const updated = [...customFields];
        updated[index][key] = value;
        setCustomFields(updated);
    };

    const removeCustomField = (index) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal modal--large animate-slide-up">
                <div className="modal__header">
                    <h2>💡 ایده جدید</h2>
                    <div className="modal__steps">
                        <span className={step >= 1 ? 'active' : ''}>۱. اطلاعات پایه</span>
                        <span className={step >= 2 ? 'active' : ''}>۲. جزئیات</span>
                    </div>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>

                <div className="modal__body">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <>
                            <Input
                                name="title"
                                label="عنوان ایده"
                                placeholder="یک عنوان کوتاه و جذاب"
                                value={formData.title}
                                onChange={handleChange}
                                error={errors.title}
                                required
                            />

                            <div className="input-group">
                                <label className="input-group__label">
                                    توضیحات ایده
                                    <span className="input-group__required">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    className={`modal__textarea ${errors.description ? 'modal__textarea--error' : ''}`}
                                    placeholder="ایده‌ات رو با جزئیات توضیح بده... حداقل ۳ جمله بنویس."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                />
                                {errors.description && (
                                    <span className="input-group__error">{errors.description}</span>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">وضعیت نمایش</label>
                                <div className="modal__visibility-options">
                                    <label className={`modal__visibility-option ${formData.visibility === 'public' ? 'modal__visibility-option--active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={formData.visibility === 'public'}
                                            onChange={handleChange}
                                        />
                                        <span>🌐</span>
                                        عمومی
                                    </label>
                                    <label className={`modal__visibility-option ${formData.visibility === 'private' ? 'modal__visibility-option--active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={formData.visibility === 'private'}
                                            onChange={handleChange}
                                        />
                                        <span>🔒</span>
                                        خصوصی
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <>
                            <Input
                                name="budget"
                                label="💰 بودجه تقریبی (اختیاری)"
                                placeholder="مثال: ۵۰ تا ۱۰۰ میلیون تومان"
                                value={formData.budget}
                                onChange={handleChange}
                            />

                            <div className="input-group">
                                <label className="input-group__label">📋 مراحل اجرا (اختیاری)</label>
                                <textarea
                                    name="execution_steps"
                                    className="modal__textarea"
                                    placeholder="مراحل پیاده‌سازی ایده رو شرح بده..."
                                    value={formData.execution_steps}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">👥 تخصص‌های مورد نیاز (اختیاری)</label>
                                <textarea
                                    name="required_skills"
                                    className="modal__textarea"
                                    placeholder="مثال: برنامه‌نویس پایتون، طراح UI/UX، مارکتینگ"
                                    value={formData.required_skills}
                                    onChange={handleChange}
                                    rows={2}
                                />
                            </div>

                            {/* Block Builder */}
                            <div className="blocks-section">
                                <label className="input-group__label">🧱 بلوک‌های ایده</label>
                                <p className="blocks-section__hint">با استفاده از بلوک‌ها، ایده‌ات رو ساختارمند کن</p>
                                <IdeaBlocks
                                    blocks={blocks}
                                    onChange={setBlocks}
                                    editable={true}
                                />
                            </div>
                        </>
                    )}

                    <div className="modal__actions">
                        {step === 1 ? (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    انصراف
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (validate()) {
                                            setStep(2);
                                        }
                                    }}
                                >
                                    مرحله بعد →
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    ← برگشت
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    loading={loading}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSubmit(e);
                                    }}
                                >
                                    🚀 ثبت ایده
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateIdeaModal;
