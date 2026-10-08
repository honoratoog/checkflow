import { useId, useState } from "react";

type LookupProps<T> = {
    items: T[];
    value: string;
    onChange: (id: string) => void;
    getId: (item: T) => number;
    getLabel: (item: T) => string;
    placeholder?: string;
};

export function Lookup<T>({ items, value, onChange, getId, getLabel, placeholder }: LookupProps<T>) {
    const listboxId = useId();
    const selecionado = items.find((item) => String(getId(item)) === value);

    const [busca, setBusca] = useState(selecionado ? getLabel(selecionado) : "");
    const [aberto, setAberto] = useState(false);
    const [destaque, setDestaque] = useState(0);

    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const itensFiltrados = termo
        ? items.filter((item) => getLabel(item).toLocaleLowerCase("pt-BR").includes(termo))
        : items;
    const destaqueSeguro = Math.min(destaque, Math.max(itensFiltrados.length - 1, 0));

    function selecionar(item: T) {
        onChange(String(getId(item)));
        setBusca(getLabel(item));
        setAberto(false);
    }

    function aoDigitar(texto: string) {
        setBusca(texto);
        setAberto(true);
        setDestaque(0);
        if (value) onChange("");
    }

    function aoPerderFoco() {
        setAberto(false);
        setBusca(selecionado ? getLabel(selecionado) : "");
    }

    function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            setAberto(false);
            return;
        }
        if (!aberto) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setAberto(true);
                setDestaque(0);
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setDestaque((d) => Math.min(d + 1, itensFiltrados.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setDestaque((d) => Math.max(d - 1, 0));
        } else if (e.key === "Enter") {
            const item = itensFiltrados[destaqueSeguro];
            if (item) {
                e.preventDefault();
                selecionar(item);
            }
        }
    }

    return (
        <div className="relative">
            <input
                role="combobox"
                aria-expanded={aberto}
                aria-controls={listboxId}
                aria-activedescendant={aberto && itensFiltrados[destaqueSeguro] ? `${listboxId}-${destaqueSeguro}` : undefined}
                className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                placeholder={placeholder}
                value={busca}
                onChange={(e) => aoDigitar(e.target.value)}
                onFocus={() => setAberto(true)}
                onBlur={aoPerderFoco}
                onKeyDown={aoTeclar}
            />
            {aberto && (
                <ul id={listboxId} role="listbox" className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-ink/15 rounded-sm shadow-sm">
                    {itensFiltrados.map((item, indice) => (
                        <li key={getId(item)} id={`${listboxId}-${indice}`} role="option" aria-selected={indice === destaqueSeguro}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selecionar(item)}
                                className={`block w-full text-left px-3 py-2 text-sm hover:bg-teal-light/40 ${
                                    indice === destaqueSeguro ? "bg-teal-light/40" : ""
                                }`}
                            >
                                {getLabel(item)}
                            </button>
                        </li>
                    ))}
                    {itensFiltrados.length === 0 && (
                        <li className="px-3 py-2 text-sm text-ink/50">Nenhum resultado</li>
                    )}
                </ul>
            )}
        </div>
    );
}
