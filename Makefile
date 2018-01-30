webdapp: web/public/whitepaper.pdf
	cd web && meteor-build-client ../dapp --path "/"
swarm:
	swarm --recursive --defaultpath dapp/index.html up dapp/
papers: whitepaper.pdf
%.pdf: %.tex
	pdflatex $<
web/public/%.pdf: %.pdf
	ln -s ../$< $@
