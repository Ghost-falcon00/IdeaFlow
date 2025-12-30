/**
 * EditIdeaModal Component - مودال ویرایش ایده (با بلوک‌ها)
 * شامل بلوک‌های پیشرفته: چک‌لیست، تگ، پیشرفت، لینک، گراف نودی
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ideaService from '../../services/ideaService';
import Button from './Button';
import Input from './Input';
import IdeaBlocks from './IdeaBlocks';
import { useToast } from '../../contexts/ToastContext';
import './Modal.css';
import './CreateIdeaModal.css';

function EditIdeaModal({ idea, onClose, onUpdate }) {
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public',
        budget: '',
        execution_steps: '',
        required_skills: '',
    });
    const [blocks, setBlocks] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (idea) {
            setFormData({
                title: idea.title || '',
                description: idea.description || '',
                visibility: idea.visibility || 'public',
                budget: idea.budget || '',
                execution_steps: idea.execution_steps || '',
                required_skills: idea.required_skills || '',
            });
            // Load blocks from idea
            let initialBlocks = idea.blocks || [];
            if (typeof initialBlocks === 'string') {
                try {
                    initialBlocks = JSON.parse(initialBlocks);
                } catch (e) {
                    console.error('Error parsing blocks:', e);
                    initialBlocks = [];
                }
            }
            setBlocks(initialBlocks);
        }

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [idea]);

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
        e.stopPropagation();
        if (!validate()) {
            setStep(1);
            return;
        }

        setLoading(true);
        try {
            const dataToSend = {
                ...formData,
                blocks: blocks,
            };
            const updatedIdea = await ideaService.updateIdea(idea.id, dataToSend);
            if (onUpdate) onUpdate(updatedIdea);
            toast.success('ایده با موفقیت ویرایش شد ✅');
            onClose();
        } catch (error) {
            console.error('Error updating idea:', error);
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                if (data.error) {
                    toast.error(data.error);
                } else {
                    const fieldErrors = {};
                    Object.keys(data).forEach(key => {
                        fieldErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
                    });
                    setErrors(fieldErrors);
                    toast.error('لطفا خطاها را برطرف کنید');
                }
            } else {
                toast.error('خطا در ویرایش ایده');
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

    const remainingEdits = idea?.remaining_edit_attempts ?? (3 - (idea?.edit_count || 0));

    return createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal modal--large animate-slide-up create-idea-modal">
                <div className="modal__header">
                    <h2>✏️ ویرایش ایده</h2>
                    <span className="modal__badge">
                        {remainingEdits} ویرایش باقیمانده
                    </span>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>

                {/* Step Indicator */}
                <div className="modal__steps">
                    <div className={`modal__step ${step === 1 ? 'modal__step--active' : step > 1 ? 'modal__step--done' : ''}`}>
                        <span className="modal__step-number">۱</span>
                        <span className="modal__step-label">اطلاعات پایه</span>
                    </div>
                    <div className="modal__step-line"></div>
                    <div className={`modal__step ${step === 2 ? 'modal__step--active' : ''}`}>
                        <span className="modal__step-number">۲</span>
                        <span className="modal__step-label">بلوک‌های پیشرفته</span>
                    </div>
                </div>

                <div className="modal__body">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <>
                            <Input
                                name="title"
                                label="عنوان ایده"
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
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="ایده خود را به طور کامل شرح دهید..."
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

                            {/* Quick Advanced Fields */}
                            <div className="modal__quick-fields">
                                <Input
                                    name="budget"
                                    label="💰 بودجه تقریبی"
                                    placeholder="مثال: ۵۰ تا ۱۰۰ میلیون تومان"
                                    value={formData.budget}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    {/* Step 2: Blocks */}
                    {step === 2 && (
                        <div className="blocks-section">
                            <div className="blocks-section__header">
                                <h3>🧩 بلوک‌های پیشرفته</h3>
                                <p>چک‌لیست، تگ، پیشرفت، لینک یا گراف نودی اضافه کنید</p>
                            </div>
                            <IdeaBlocks
                                blocks={blocks}
                                onChange={setBlocks}
                                editable={true}
                            />
                        </div>
                    )}

                    {/* Navigation Buttons */}
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
                                    disabled={remainingEdits <= 0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSubmit(e);
                                    }}
                                >
                                    {remainingEdits <= 0 ? 'سقف ویرایش تمام شد' : '💾 ذخیره تغییرات'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default EditIdeaModal;
