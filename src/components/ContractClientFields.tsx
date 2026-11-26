import React from 'react';
import { Building2, MapPin, User } from 'lucide-react';
import type { ContractClientData, LegalNature, PersonType } from '../types/contracts';

interface ContractClientFieldsProps {
  value: ContractClientData;
  onChange: (next: ContractClientData) => void;
  disabled?: boolean;
}

const inputCls =
  'w-full bg-[#0d100e] border border-[#2c342e] px-3.5 py-2.5 text-sm text-[#f0f1ed] placeholder:text-[#667068] focus:outline-none focus:border-[#9baf91] transition-colors disabled:opacity-60';
const labelCls = 'block text-xs font-medium text-[#b9c2ba] mb-1.5';

export function ContractClientFields({
  value,
  onChange,
  disabled = false,
}: ContractClientFieldsProps) {
  const set = <K extends keyof ContractClientData>(key: K, val: ContractClientData[K]) => {
    onChange({ ...value, [key]: val });
  };

  const handlePersonType = (type: PersonType) => {
    if (disabled) return;
    set('personType', type);
  };

  return (
    <div className="space-y-6">
      {/* PF / PJ Segmented Selector */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#9eb297] mb-2">
          Tipo de contratante
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePersonType('PF')}
            className={`p-4 border text-left transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed ${
              value.personType === 'PF'
                ? 'bg-[#1a221c] border-[#9baf91] text-[#f0f1ed]'
                : 'bg-[#0e110f] border-[#262d28] text-[#9aa49c] hover:border-[#3e4a40]'
            }`}
          >
            <User
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                value.personType === 'PF' ? 'text-[#c0d0b8]' : 'text-[#6e7870]'
              }`}
            />
            <div>
              <div className="text-sm font-semibold">Pessoa Física (PF)</div>
              <div className="text-xs text-[#8f9991] mt-0.5">
                Nome completo, CPF, RG, estado civil, profissão e endereço residencial.
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePersonType('PJ')}
            className={`p-4 border text-left transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed ${
              value.personType === 'PJ'
                ? 'bg-[#1a221c] border-[#9baf91] text-[#f0f1ed]'
                : 'bg-[#0e110f] border-[#262d28] text-[#9aa49c] hover:border-[#3e4a40]'
            }`}
          >
            <Building2
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                value.personType === 'PJ' ? 'text-[#c0d0b8]' : 'text-[#6e7870]'
              }`}
            />
            <div>
              <div className="text-sm font-semibold">Pessoa Jurídica (PJ)</div>
              <div className="text-xs text-[#8f9991] mt-0.5">
                Razão social, CNPJ, sede e qualificação completa do sócio administrador.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* PF Fields */}
      {value.personType === 'PF' ? (
        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Qualificação — Pessoa Física
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Nome completo *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder="Ex.: João Carlos da Silva"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nacionalidade *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.nationality}
                onChange={(e) => set('nationality', e.target.value)}
                placeholder="Ex.: brasileiro"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Estado civil *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.maritalStatus}
                onChange={(e) => set('maritalStatus', e.target.value)}
                placeholder="Ex.: casado, solteiro, divorciado"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Profissão *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.profession}
                onChange={(e) => set('profession', e.target.value)}
                placeholder="Ex.: empresário, médico, servidor público"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>E-mail (para comunicações do contrato) *</label>
              <input
                type="email"
                disabled={disabled}
                value={value.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="cliente@email.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>CPF *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Documento de Identidade (RG) *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.rg}
                onChange={(e) => set('rg', e.target.value)}
                placeholder="0.000.000-0 SSP/PR"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Endereço residencial (Rua, nº, complemento) *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.addressStreet}
                onChange={(e) => set('addressStreet', e.target.value)}
                placeholder="Ex.: Av. Paraná, 1234, Apto 302"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Bairro *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.addressNeighborhood}
                onChange={(e) => set('addressNeighborhood', e.target.value)}
                placeholder="Ex.: Zona I"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Cidade *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.addressCity}
                  onChange={(e) => set('addressCity', e.target.value)}
                  placeholder="Umuarama"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>UF *</label>
                <input
                  type="text"
                  disabled={disabled}
                  maxLength={2}
                  value={value.addressState}
                  onChange={(e) => set('addressState', e.target.value.toUpperCase())}
                  placeholder="PR"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PJ Fields */
        <div className="space-y-4">
          <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
            <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
              Qualificação — Pessoa Jurídica (Empresa)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Razão social / Nome da empresa *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="Ex.: Construtora Modelo Ltda."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Natureza jurídica *</label>
                <select
                  disabled={disabled}
                  value={value.legalNature}
                  onChange={(e) => set('legalNature', e.target.value as LegalNature)}
                  className={inputCls}
                >
                  <option value="privado">Pessoa jurídica de direito privado</option>
                  <option value="publico">Pessoa jurídica de direito público</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>CNPJ *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.cnpj}
                  onChange={(e) => set('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Endereço completo da sede *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.companyAddress}
                  onChange={(e) => set('companyAddress', e.target.value)}
                  placeholder="Rua, nº, bairro, cidade – UF, CEP"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
            <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
              Representante Legal (Sócio Administrador)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Nome completo do sócio administrador *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repFullName}
                  onChange={(e) => set('repFullName', e.target.value)}
                  placeholder="Nome completo"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nacionalidade *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repNationality}
                  onChange={(e) => set('repNationality', e.target.value)}
                  placeholder="brasileiro"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Estado civil *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repMaritalStatus}
                  onChange={(e) => set('repMaritalStatus', e.target.value)}
                  placeholder="casado"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Profissão *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repProfession}
                  onChange={(e) => set('repProfession', e.target.value)}
                  placeholder="empresário"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>E-mail do representante *</label>
                <input
                  type="email"
                  disabled={disabled}
                  value={value.repEmail}
                  onChange={(e) => set('repEmail', e.target.value)}
                  placeholder="socio@empresa.com.br"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>CPF do representante *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repCpf}
                  onChange={(e) => set('repCpf', e.target.value)}
                  placeholder="000.000.000-00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>RG do representante *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repRg}
                  onChange={(e) => set('repRg', e.target.value)}
                  placeholder="0.000.000-0"
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Endereço residencial do sócio (Rua, nº) *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repAddressStreet}
                  onChange={(e) => set('repAddressStreet', e.target.value)}
                  placeholder="Rua, nº, complemento"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bairro *</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={value.repAddressNeighborhood}
                  onChange={(e) => set('repAddressNeighborhood', e.target.value)}
                  placeholder="Bairro"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Cidade *</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={value.repAddressCity}
                    onChange={(e) => set('repAddressCity', e.target.value)}
                    placeholder="Umuarama"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>UF *</label>
                  <input
                    type="text"
                    disabled={disabled}
                    maxLength={2}
                    value={value.repAddressState}
                    onChange={(e) => set('repAddressState', e.target.value.toUpperCase())}
                    placeholder="PR"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property identification (used in Reference & Clause 1) */}
      <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          Identificação do Imóvel / Obra
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Endereço do imóvel (Rua, nº, lote/quadra) *</label>
            <input
              type="text"
              disabled={disabled}
              value={value.propertyStreet}
              onChange={(e) => set('propertyStreet', e.target.value)}
              placeholder="Ex.: Rua das Flores, 450 — Lote 12, Quadra 04"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bairro do imóvel *</label>
            <input
              type="text"
              disabled={disabled}
              value={value.propertyNeighborhood}
              onChange={(e) => set('propertyNeighborhood', e.target.value)}
              placeholder="Ex.: Jardim Panorama"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Cidade do imóvel *</label>
              <input
                type="text"
                disabled={disabled}
                value={value.propertyCity}
                onChange={(e) => set('propertyCity', e.target.value)}
                placeholder="Umuarama"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>UF *</label>
              <input
                type="text"
                disabled={disabled}
                maxLength={2}
                value={value.propertyState}
                onChange={(e) => set('propertyState', e.target.value.toUpperCase())}
                placeholder="PR"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Matrícula nº (Cartório de Registro de Imóveis)</label>
            <input
              type="text"
              disabled={disabled}
              value={value.propertyRegistration}
              onChange={(e) => set('propertyRegistration', e.target.value)}
              placeholder="Ex.: 45.821 — 1º CRI"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Inscrição municipal / Cadastro IPTU</label>
            <input
              type="text"
              disabled={disabled}
              value={value.propertyMunicipalCode}
              onChange={(e) => set('propertyMunicipalCode', e.target.value)}
              placeholder="Ex.: 01.04.012.0045.001"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
