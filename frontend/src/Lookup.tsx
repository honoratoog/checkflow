import { useEffect, useRef, useState } from "react";

type LookupProps<T> = {
    items: T[];
    value: string;
    onChange: (id: string) => void;
    getId: (item: T) => number;
    getLabel: (item: T) => string;
    placeholder?: string;
};

export function Lookup<T>({ items, value, onChange, getId, getLabel, placeholder }: LookupProps<T>) {
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selecionado = items.find((item) => String(getId(item)) === value);

    useEffect(() => {
        setBusca(selecionado ? getLabel(selecionado) : "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        function aoClicarFora(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setAberto(false);
                setBusca(selecionado ? getLabel(selecionado) : "");
            }
        }
        document.addEventListener("mousedown", aoClicarFora);
        return () => document.removeEventListener("mousedown", aoClicarFora);
    }, [selecionado, getLabel]);

    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const itensFiltrados = termo
        ? items.filter((item) => getLabel(item).toLocaleLowerCase("pt-BR").includes(termo))
        : items;

    function selecionar(item: T) {
        onChange(String(getId(item)));
        setBusca(getLabel(item));
        setAberto(false);
    }

    return (
        <div ref={containerRef} className="relative">
            <input
                role="combobox"
                aria-expanded={aberto}
                aria-controls="lookup-lista"
                className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                placeholder={placeholder}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onFocus={() => setAberto(true)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setAberto(false);
                }}
            />
            {aberto && (
                <ul id="lookup-lista" role="listbox" className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-ink/15 rounded-sm shadow-sm">
                    {itensFiltrados.map((item) => (
                        <li key={getId(item)} role="option">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selecionar(item)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-light/40"
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
