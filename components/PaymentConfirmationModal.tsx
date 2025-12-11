import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Calendar, DollarSign, Building2, Calculator } from 'lucide-react';
import { Transaction, BankAccount } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { paymentDate: string; bankAccountId: string; interest: number; penalty: number; discount: number; finalAmount: number; paidAmount: number }) => void;
  transaction: Transaction | null;
  bankAccounts: BankAccount[];
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, transaction, bankAccounts
}) => {
  const [paymentDate, setPaymentDate] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [interest, setInterest] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    if (isOpen && transaction) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setBankAccountId(transaction.bankAccountId || '');
      setInterest(0);
      setPenalty(0);
      setDiscount(0);
      setPaidAmount(Math.abs(transaction.amount));
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const originalAmount = Math.abs(transaction.amount);
  const totalWithAdditions = paidAmount + interest + penalty - discount;
  const remainingAmount = originalAmount - paidAmount;

  const handleConfirm = () => {
    onConfirm({
      paymentDate,
      bankAccountId,
      interest,
      penalty,
      discount,
      paidAmount,
      finalAmount: transaction.type === 'expense' ? -totalWithAdditions : totalWithAdditions
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Confirmar Pagamento</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold mb-1">Descrição</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">{transaction.description}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Valor Original</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalAmount)}
                </p>
              </div>
              <div className="flex-1 ml-4 border-l border-zinc-200 pl-4">
                <label className="block text-xs font-bold text-emerald-600 mb-1">Valor a Pagar (Principal)</label>
                <CurrencyInput
                  value={paidAmount}
                  onChange={setPaidAmount}
                  className="w-full bg-white dark:bg-zinc-950 border border-emerald-500 rounded p-1 text-sm font-bold text-emerald-700"
                />
                {remainingAmount > 0 && (
                  <p className="text-xs text-orange-500 font-bold mt-1">
                    Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount)}
                    <span className="block text-[10px] text-zinc-400 font-normal">Será criado um novo lançamento pendente.</span>
                  </p>
                )}
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {transaction.type === 'income' ? 'Entrada' : 'Saída'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Data Pagamento</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Conta Bancária</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Selecione...</option>
                {bankAccounts.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Juros (+)</label>
              <CurrencyInput
                value={interest}
                onChange={(val) => setInterest(val)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-rose-600 dark:text-rose-400 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Multa (+)</label>
              <CurrencyInput
                value={penalty}
                onChange={(val) => setPenalty(val)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-rose-600 dark:text-rose-400 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Desconto (-)</label>
              <CurrencyInput
                value={discount}
                onChange={(val) => setDiscount(val)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="bg-zinc-900 dark:bg-zinc-950 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Calculator size={18} />
              <div className="flex flex-col">
                <span className="text-sm">Total Realizado:</span>
                <span className="text-[10px] text-zinc-500">(Principal + Juros/Multa - Desconto)</span>
              </div>
            </div>
            <span className="text-xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalWithAdditions)}
            </span>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
};
