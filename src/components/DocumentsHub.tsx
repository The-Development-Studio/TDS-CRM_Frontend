import React, { FormEvent, useEffect, useState } from 'react';
import { Download, FileText, Trash2, UploadCloud } from 'lucide-react';
import { deleteSharedDocument, getSharedDocumentDownloadUrl, listSharedDocuments, SharedDocument, uploadSharedDocument } from '../data/sharedDocuments';

const categories = ['Legal Contract', 'Statement of Work', 'Invoice', 'Compliance', 'Security', 'Commercial', 'Other'];
const maxFileSize = 20 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentsHub: React.FC = () => {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [client, setClient] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listSharedDocuments()
      .then(setDocuments)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load documents.'));
  }, []);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Choose a file to upload.');
      return;
    }
    if (selectedFile.size === 0) {
      setError('The selected file is empty.');
      return;
    }
    if (selectedFile.size > maxFileSize) {
      setError('Files must be 20 MB or smaller.');
      return;
    }

    setIsSaving(true);
    setError('');
    const document: SharedDocument = {
      id: crypto.randomUUID(),
      name: selectedFile.name,
      category,
      client: client.trim() || 'Internal',
      size: selectedFile.size,
      mimeType: selectedFile.type || 'application/octet-stream',
      updatedAt: new Date().toISOString()
    };

    try {
      await uploadSharedDocument(document, selectedFile);
      setDocuments(await listSharedDocuments());
      setSelectedFile(null);
      setCategory(categories[0]);
      setClient('');
      setUploadOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save this shared document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (sharedDocument: SharedDocument) => {
    try {
      const url = await getSharedDocumentDownloadUrl(sharedDocument.id);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.click();
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not download this document.');
    }
  };

  const handleDelete = async (document: SharedDocument) => {
    if (!window.confirm(`Delete "${document.name}" from the shared repository?`)) return;
    try {
      await deleteSharedDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete this document.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Document Repository</h1>
          <p className="mt-1 text-xs text-slate-500">Shared files are stored securely and can be assigned to a customer account.</p>
        </div>
        <button type="button" onClick={() => { setUploadOpen((open) => !open); setError(''); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#e65c00]">
          <UploadCloud className="h-4 w-4" /> {uploadOpen ? 'Close upload' : 'Upload document'}
        </button>
      </header>

      {uploadOpen && (
        <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
          <div className="sm:col-span-2">
            <label htmlFor="document-file" className="block text-xs font-semibold text-slate-700">File (maximum 20 MB)</label>
            <input id="document-file" type="file" required onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-orange-800" />
          </div>
          <div>
            <label htmlFor="document-category" className="block text-xs font-semibold text-slate-700">Category</label>
            <select id="document-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="document-client" className="block text-xs font-semibold text-slate-700">Customer / client</label>
            <input id="document-client" value={client} onChange={(event) => setClient(event.target.value)} placeholder="Customer name or Internal" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400" />
          </div>
          {error && <p role="alert" className="text-xs font-medium text-rose-700 sm:col-span-2">{error}</p>}
          <div className="flex justify-end sm:col-span-2">
            <button type="submit" disabled={isSaving} className="rounded-lg bg-[#ff6600] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#e65c00] disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save document'}
            </button>
          </div>
        </form>
      )}

      {!uploadOpen && error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-bold text-slate-900">Uploaded files</h2>
          <span className="text-xs text-slate-500">{documents.length} documents</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Document</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold text-slate-800"><FileText className="h-4 w-4 shrink-0 text-[#ff6600]" />{document.name}</div></td>
                  <td className="px-4 py-3 text-slate-600">{document.category}</td>
                  <td className="px-4 py-3 text-slate-600">{document.client}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{formatFileSize(document.size)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(document.updatedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => handleDownload(document)} title="Download document" aria-label={`Download ${document.name}`} className="rounded p-1.5 text-slate-500 hover:bg-orange-50 hover:text-[#ff6600]"><Download className="h-4 w-4" /></button>
                    <button type="button" onClick={() => handleDelete(document)} title="Delete document" aria-label={`Delete ${document.name}`} className="rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {!documents.length && <tr><td colSpan={6} className="px-4 py-16 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No uploaded files</p><p className="mt-1 text-xs text-slate-500">Upload a customer or company document to get started.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
