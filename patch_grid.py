with open('src/components/album/PhotobookStage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_grid_cover = """                <div className="aspect-[3/4.2] overflow-hidden relative">
                  <img
                    src={album.coverImage}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2.5 text-white">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                      封面
                    </span>
                    <h5 className="text-xs font-bold font-serif truncate mt-0.5">{album.title}</h5>
                  </div>
                </div>"""

new_grid_cover = """                <div className="aspect-[3/2] overflow-hidden relative flex items-center justify-center p-2 bg-stone-900/10">
                  <div className="h-full aspect-[3/4.2] rounded-r-md overflow-hidden shadow-md relative">
                    <img
                      src={album.coverImage}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 text-white flex items-end justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                      画册封面
                    </span>
                    <h5 className="text-[11px] font-bold font-serif truncate max-w-[120px]">{album.title}</h5>
                  </div>
                </div>"""

text = text.replace(old_grid_cover, new_grid_cover)

with open('src/components/album/PhotobookStage.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Grid cover patched!")
