import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCreateProduct } from '../hooks/useProducts';
import {
  ArrowLeftIcon,
  FileTextIcon,
  ImageIcon,
  SparklesIcon,
  TypeIcon,
  Currency,
  Wand2Icon,
} from 'lucide-react';
import type { ProductFormData } from '../types';
import { useAuth } from '@clerk/clerk-react';

const CreatePage = () => {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    imageUrl: '',
    price: null,
  });
  const [aiStatus, setAiStatus] = useState<
    'idle' | 'loading' | 'streaming' | 'error'
  >('idle');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createProduct.mutate(formData, {
      onSuccess: () => navigate('/'),
    });
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) return;
    setAiStatus('loading');
    setFormData((prev) => ({ ...prev, description: '' }));

    try {
      const token = await getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productTitle: formData.title }),
        },
      );
      if (!res.ok) throw new Error('Generation Failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      setAiStatus('streaming');
      
      // Safety timeout — if no data arrives for 10s, assume stream ended silently
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          reader.cancel();
          setAiStatus('idle');
        }, 100000);
      };

      resetTimeout();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          clearTimeout(timeoutId);
          setAiStatus('idle');
          break;
        }

        resetTimeout(); // reset on every chunk received

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            clearTimeout(timeoutId);
            setAiStatus('idle');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              setFormData((prev) => ({
                ...prev,
                description: prev.description + parsed.token,
              }));
            }
          } catch {}
        }
      }
    } catch (error) {
      setAiStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/" className="btn btn-ghost btn-sm gap-1 mb-4">
        <ArrowLeftIcon className="size-4" /> Back
      </Link>

      <div className="card bg-base-300">
        <div className="card-body">
          <h1 className="card-title">
            <SparklesIcon className="size-5 text-primary" />
            New Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <TypeIcon className="size-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Product title"
                className="grow"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </label>

            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <ImageIcon className="size-4 text-base-content/50" />
              <input
                type="url"
                placeholder="Image URL"
                className="grow"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                required
              />
            </label>

            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <Currency className="size-4 text-base-content/50" />
              <input
                type="number"
                placeholder="RM"
                className="grow"
                value={formData.price ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value || null })
                }
                required
              />
            </label>

            {formData.imageUrl && (
              <div className="rounded-box overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            <div className="form-control">
              <div className="flex items-start gap-2 p-3 rounded-box bg-base-200 border border-base-300">
                <FileTextIcon className="size-4 text-base-content/50 mt-1" />
                <div className="relative grow">
                  <textarea
                    placeholder={
                      aiStatus === 'loading'
                        ? 'Generating...'
                        : aiStatus === 'error'
                          ? 'Generation failed. Try again.'
                          : 'Description'
                    }
                    className="w-full bg-transparent resize-none focus:outline-none min-h-24"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={
                      aiStatus === 'loading' || aiStatus === 'streaming'
                    }
                    required
                  />

                  {formData.title.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={
                        aiStatus === 'loading' || aiStatus === 'streaming'
                      }
                      className="absolute bottom-0 right-0 btn btn-ghost btn-xs gap-1 text-primary"
                      title="Generate description with AI"
                    >
                      {aiStatus === 'loading' || aiStatus === 'streaming' ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <>
                          <Wand2Icon className="size-3" />
                          <span className="text-xs">AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {createProduct.isError && (
              <div role="alert" className="alert alert-error alert-sm">
                <span>Failed to create. Try again.</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? (
                <span className="loading loading-spinner" />
              ) : (
                'Create Product'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
